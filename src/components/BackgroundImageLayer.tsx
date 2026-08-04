import { convertFileSrc } from "@tauri-apps/api/core";
import { useSettingsStore, type BackgroundImageScope } from "@/stores/settingsStore";
import { useBackgroundImage } from "@/lib/useBackgroundImage";
import { useBackgroundImageDraftStore } from "@/stores/backgroundImageDraftStore";

/**
 * Decorative app-managed image painted behind translucent theme surfaces.
 * Scope owners mount their own layer, so workspace mode never bleeds into the
 * dock columns while window mode naturally covers the full shell.
 */
export function BackgroundImageLayer({ scope }: { scope: BackgroundImageScope }) {
  const { path, active, previewingDraft } = useBackgroundImage(scope);

  if (!path || !active) {
    return null;
  }

  return (
    <img
      src={convertFileSrc(path)}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-testid={`background-image-${scope}`}
      onError={() => {
        if (previewingDraft) {
          useBackgroundImageDraftStore.getState().markImageFailed();
        } else {
          useSettingsStore.getState().clearBackgroundImage();
        }
      }}
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full select-none object-cover object-center"
    />
  );
}
