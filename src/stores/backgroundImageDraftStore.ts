import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import {
  MAX_BACKGROUND_IMAGE_OPACITY,
  MIN_BACKGROUND_IMAGE_OPACITY,
  useSettingsStore,
  type BackgroundImageScope,
} from "@/stores/settingsStore";

export interface BackgroundImageConfig {
  path: string | null;
  opacity: number;
  terminalOpacity: number;
  scope: BackgroundImageScope;
  textColor: string | null;
}

export interface EffectiveBackgroundImageConfig extends BackgroundImageConfig {
  active: boolean;
  previewingDraft: boolean;
}

export interface BackgroundImageDraft extends BackgroundImageConfig {
  /** Unsaved local source that must be imported only when Apply is pressed. */
  sourcePath: string | null;
  imageFailed: boolean;
}

interface BackgroundImageDraftState {
  baseline: BackgroundImageConfig | null;
  draft: BackgroundImageDraft | null;
  previewActive: boolean;
  panelCollapsed: boolean;
  busy: boolean;
  errorKey: string | null;
  begin: (config: BackgroundImageConfig) => void;
  update: (patch: Partial<BackgroundImageConfig>) => void;
  stageImage: (sourcePath: string) => void;
  stageRemoval: () => void;
  resetChanges: () => void;
  enterPreview: () => void;
  leavePreview: () => void;
  cancel: () => void;
  setPanelCollapsed: (collapsed: boolean) => void;
  markImageFailed: () => void;
  clearError: () => void;
}

const SAVE_ERROR_KEYS: Record<string, string> = {
  invalidFile: "background.invalidFileError",
  unsupportedFormat: "background.unsupportedFormatError",
  fileTooLarge: "background.fileTooLargeError",
  storageUnavailable: "background.storageError",
};

function saveErrorKey(error: unknown): string {
  const code = typeof error === "string" ? error : null;
  return (code && SAVE_ERROR_KEYS[code]) || "background.saveError";
}

function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return MIN_BACKGROUND_IMAGE_OPACITY;
  return Math.min(
    MAX_BACKGROUND_IMAGE_OPACITY,
    Math.max(MIN_BACKGROUND_IMAGE_OPACITY, Math.round(value)),
  );
}

function draftFrom(config: BackgroundImageConfig): BackgroundImageDraft {
  return { ...config, sourcePath: null, imageFailed: false };
}

export function currentBackgroundImageConfig(): BackgroundImageConfig {
  const settings = useSettingsStore.getState();
  return {
    path: settings.backgroundImagePath,
    opacity: settings.backgroundImageOpacity,
    terminalOpacity: settings.terminalBackgroundImageOpacity,
    scope: settings.backgroundImageScope,
    textColor: settings.backgroundImageTextColor,
  };
}

export function backgroundImageDraftIsDirty(
  baseline: BackgroundImageConfig | null,
  draft: BackgroundImageDraft | null,
): boolean {
  if (!baseline || !draft) return false;
  return (
    draft.sourcePath !== null ||
    draft.path !== baseline.path ||
    draft.opacity !== baseline.opacity ||
    draft.terminalOpacity !== baseline.terminalOpacity ||
    draft.scope !== baseline.scope ||
    draft.textColor !== baseline.textColor
  );
}

export const useBackgroundImageDraftStore = create<BackgroundImageDraftState>()(
  (set) => ({
    baseline: null,
    draft: null,
    previewActive: false,
    panelCollapsed: false,
    busy: false,
    errorKey: null,
    begin: (config) =>
      set((state) =>
        state.draft
          ? state
          : { baseline: config, draft: draftFrom(config), errorKey: null },
      ),
    update: (patch) =>
      set((state) => {
        if (!state.draft) return state;
        return {
          draft: {
            ...state.draft,
            ...patch,
            opacity:
              patch.opacity === undefined
                ? state.draft.opacity
                : clampOpacity(patch.opacity),
            terminalOpacity:
              patch.terminalOpacity === undefined
                ? state.draft.terminalOpacity
                : clampOpacity(patch.terminalOpacity),
          },
          errorKey: null,
        };
      }),
    stageImage: (sourcePath) =>
      set((state) => {
        if (!state.draft) return state;
        return {
          draft: {
            ...state.draft,
            path: sourcePath,
            sourcePath,
            imageFailed: false,
          },
          errorKey: null,
        };
      }),
    stageRemoval: () =>
      set((state) => {
        if (!state.draft) return state;
        return {
          draft: {
            ...state.draft,
            path: null,
            sourcePath: null,
            imageFailed: false,
          },
          errorKey: null,
        };
      }),
    resetChanges: () =>
      set((state) => ({
        draft: state.baseline ? draftFrom(state.baseline) : null,
        previewActive: false,
        panelCollapsed: false,
        errorKey: null,
      })),
    enterPreview: () =>
      set((state) => ({
        previewActive: Boolean(state.draft && !state.draft.imageFailed),
        panelCollapsed: false,
        errorKey: null,
      })),
    leavePreview: () => set({ previewActive: false, panelCollapsed: false }),
    cancel: () =>
      set({
        baseline: null,
        draft: null,
        previewActive: false,
        panelCollapsed: false,
        busy: false,
        errorKey: null,
      }),
    setPanelCollapsed: (panelCollapsed) => set({ panelCollapsed }),
    markImageFailed: () =>
      set((state) => ({
        draft: state.draft
          ? { ...state.draft, imageFailed: true }
          : state.draft,
        errorKey: state.draft?.sourcePath
          ? "background.previewSourceError"
          : "background.loadError",
      })),
    clearError: () => set({ errorKey: null }),
  }),
);

/** Commit the complete draft only after any required filesystem operation succeeds. */
export async function commitBackgroundImageDraft(): Promise<boolean> {
  const state = useBackgroundImageDraftStore.getState();
  const { baseline, draft } = state;
  if (!baseline || !draft || draft.imageFailed || state.busy) return false;

  useBackgroundImageDraftStore.setState({ busy: true, errorKey: null });
  try {
    let committedPath = draft.path;
    if (draft.sourcePath) {
      committedPath = await invoke<string>("appearance_save_background_image", {
        sourcePath: draft.sourcePath,
      });
    } else if (baseline.path && !draft.path) {
      await invoke("appearance_remove_background_image");
    }

    const committed: BackgroundImageConfig = {
      path: committedPath,
      opacity: draft.opacity,
      terminalOpacity: draft.terminalOpacity,
      scope: draft.scope,
      textColor: draft.textColor,
    };
    useSettingsStore.setState({
      backgroundImagePath: committed.path,
      backgroundImageOpacity: committed.opacity,
      terminalBackgroundImageOpacity: committed.terminalOpacity,
      backgroundImageScope: committed.scope,
      backgroundImageTextColor: committed.textColor,
    });
    useBackgroundImageDraftStore.setState({
      baseline: committed,
      draft: draftFrom(committed),
      previewActive: false,
      panelCollapsed: false,
      busy: false,
      errorKey: null,
    });
    return true;
  } catch (error) {
    const removing = Boolean(baseline.path && !draft.path && !draft.sourcePath);
    useBackgroundImageDraftStore.setState({
      busy: false,
      errorKey: removing ? "background.removeError" : saveErrorKey(error),
    });
    return false;
  }
}
