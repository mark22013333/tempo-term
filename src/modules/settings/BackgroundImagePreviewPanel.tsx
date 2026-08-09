import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  PanelRightClose,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { BackgroundImageDraftControls } from "./BackgroundImageDraftControls";
import {
  backgroundImageDraftIsDirty,
  commitBackgroundImageDraft,
  useBackgroundImageDraftStore,
} from "@/stores/backgroundImageDraftStore";
import { useUiStore } from "@/stores/uiStore";

export function BackgroundImagePreviewPanel() {
  const { t } = useTranslation("settings");
  const draft = useBackgroundImageDraftStore((state) => state.draft);
  const baseline = useBackgroundImageDraftStore((state) => state.baseline);
  const collapsed = useBackgroundImageDraftStore((state) => state.panelCollapsed);
  const busy = useBackgroundImageDraftStore((state) => state.busy);
  const errorKey = useBackgroundImageDraftStore((state) => state.errorKey);
  const leavePreview = useBackgroundImageDraftStore((state) => state.leavePreview);
  const cancel = useBackgroundImageDraftStore((state) => state.cancel);
  const setCollapsed = useBackgroundImageDraftStore(
    (state) => state.setPanelCollapsed,
  );
  const setSettingsOpen = useUiStore((state) => state.setSettingsOpen);
  const dirty = backgroundImageDraftIsDirty(baseline, draft);

  if (!draft) return null;

  const filename = draft.path?.split(/[\\/]/).pop();

  if (collapsed) {
    return (
      <button
        type="button"
        data-testid="background-preview-panel-collapsed"
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto fixed right-4 top-16 inline-flex items-center gap-2 rounded-full border border-accent/50 bg-bg-elevated px-3 py-2 text-xs font-medium text-fg shadow-2xl transition-transform hover:-translate-x-0.5"
      >
        <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" />
        {t("background.livePreviewStatus")}
        <ChevronRight size={14} className="text-fg-muted" />
      </button>
    );
  }

  return (
    <aside
      data-testid="background-preview-panel"
      aria-label={t("background.livePreviewPanel")}
      className="pointer-events-auto fixed bottom-10 right-4 top-16 flex w-[min(340px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border-strong bg-bg shadow-2xl"
    >
      <div className="relative border-b border-border bg-bg-inset px-4 py-3">
        <div className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-fg">
              <Eye size={15} className="text-accent" />
              {t("background.livePreviewTitle")}
            </div>
            <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
              {t("background.livePreviewStatus")}
            </div>
          </div>
          <button
            type="button"
            aria-label={t("background.collapsePreviewPanel")}
            onClick={() => setCollapsed(true)}
            className="rounded-md p-1.5 text-fg-muted transition-colors hover:bg-bg-elevated hover:text-fg"
          >
            <PanelRightClose size={16} />
          </button>
        </div>
        <p className="mt-2 truncate text-[11px] text-fg-subtle">
          {filename ?? t("background.removalPreview")}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <BackgroundImageDraftControls compact />
        {errorKey && (
          <p role="alert" className="mt-4 text-xs leading-relaxed text-danger">
            {t(errorKey)}
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-border bg-bg-inset p-3">
        <button
          type="button"
          onClick={leavePreview}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-bg px-3 py-2 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft size={14} />
          {t("background.returnToSettings")}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              cancel();
              setSettingsOpen(false);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
          >
            <RotateCcw size={14} />
            {t("background.cancelChanges")}
          </button>
          <button
            type="button"
            disabled={!dirty || busy || draft.imageFailed}
            onClick={() => void commitBackgroundImageDraft()}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-accent bg-accent px-3 py-2 text-xs font-semibold text-white transition-[opacity,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check size={14} />
            {busy ? t("background.saving") : t("background.applyChanges")}
          </button>
        </div>
      </div>
    </aside>
  );
}
