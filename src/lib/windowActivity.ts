import { invoke } from "@tauri-apps/api/core";
import { useSyncExternalStore } from "react";

let visible = typeof document === "undefined" || document.visibilityState === "visible";
const listeners = new Set<() => void>();
let initialized = false;

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function publish(next: boolean): void {
  if (next === visible) return;
  visible = next;
  for (const listener of listeners) listener();
  if (hasTauriRuntime()) {
    void invoke("pty_set_window_active", { active: visible }).catch(() => {});
    void invoke("ssh_set_window_active", { active: visible }).catch(() => {});
  }
}

function initialize(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  document.addEventListener("visibilitychange", () => {
    publish(document.visibilityState === "visible");
  });
}

export function isWindowVisible(): boolean {
  initialize();
  return visible;
}

export function useWindowVisible(): boolean {
  initialize();
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => visible,
    () => true,
  );
}
