import { useSyncExternalStore } from "react";

let visible = typeof document === "undefined" || document.visibilityState === "visible";
const listeners = new Set<() => void>();
let initialized = false;

function publish(next: boolean): void {
  if (next === visible) return;
  visible = next;
  for (const listener of listeners) listener();
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
