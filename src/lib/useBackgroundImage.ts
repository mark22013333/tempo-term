import {
  useSettingsStore,
  type BackgroundImageScope,
} from "@/stores/settingsStore";
import {
  useBackgroundImageDraftStore,
  type EffectiveBackgroundImageConfig,
} from "@/stores/backgroundImageDraftStore";

/** Keep background-image state and its active predicate consistent everywhere. */
export function useBackgroundImage(
  scope?: BackgroundImageScope,
): EffectiveBackgroundImageConfig {
  const path = useSettingsStore((state) => state.backgroundImagePath);
  const opacity = useSettingsStore((state) => state.backgroundImageOpacity);
  const terminalOpacity = useSettingsStore(
    (state) => state.terminalBackgroundImageOpacity,
  );
  const configuredScope = useSettingsStore((state) => state.backgroundImageScope);
  const textColor = useSettingsStore((state) => state.backgroundImageTextColor);
  const draft = useBackgroundImageDraftStore((state) => state.draft);
  const previewActive = useBackgroundImageDraftStore(
    (state) => state.previewActive,
  );
  const previewingDraft = Boolean(previewActive && draft);
  const effectivePath = previewingDraft ? draft?.path ?? null : path;
  const effectiveOpacity = previewingDraft ? draft?.opacity ?? opacity : opacity;
  const effectiveTerminalOpacity = previewingDraft
    ? draft?.terminalOpacity ?? terminalOpacity
    : terminalOpacity;
  const effectiveScope = previewingDraft ? draft?.scope ?? configuredScope : configuredScope;
  const effectiveTextColor = previewingDraft ? draft?.textColor ?? null : textColor;
  const active =
    Boolean(effectivePath) &&
    effectiveOpacity > 0 &&
    !(previewingDraft && draft?.imageFailed) &&
    (scope === undefined || effectiveScope === scope);

  return {
    path: effectivePath,
    opacity: effectiveOpacity,
    terminalOpacity: effectiveTerminalOpacity,
    scope: effectiveScope,
    textColor: effectiveTextColor,
    active,
    previewingDraft,
  };
}
