import { getCurrentWebview, type DragDropEvent } from "@tauri-apps/api/webview";
import type { Event } from "@tauri-apps/api/event";
import { IS_MAC } from "@/lib/platform";

type NativeDragHandler = (event: Event<DragDropEvent>) => boolean | void;

interface NativeDragSubscriber {
  handler: NativeDragHandler;
  priority: number;
}

const nativeDragSubscribers = new Map<number, NativeDragSubscriber>();
let nextSubscriberId = 0;
let nativeUnlisten: (() => void) | null = null;
let nativeSubscription: Promise<void> | null = null;

/**
 * macOS reports drag positions in logical window coordinates, while the
 * Windows webview reports physical pixels on scaled displays.
 */
export function nativePointInElement(
  element: Element,
  x: number,
  y: number,
  devicePixelRatio = window.devicePixelRatio || 1,
  positionIsPhysical = !IS_MAC,
): boolean {
  const rect = element.getBoundingClientRect();
  const scale = positionIsPhysical && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const clientX = x / scale;
  const clientY = y / scale;
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function ensureNativeDragSubscription(): void {
  if (nativeSubscription || nativeUnlisten) {
    return;
  }
  try {
    nativeSubscription = getCurrentWebview()
      .onDragDropEvent((event) => {
        const subscribers = Array.from(nativeDragSubscribers.values()).sort(
          (left, right) => right.priority - left.priority,
        );
        for (const subscriber of subscribers) {
          const consumed = subscriber.handler(event) === true;
          if (consumed && event.payload.type !== "leave") {
            break;
          }
        }
      })
      .then((stopListening) => {
        nativeSubscription = null;
        if (nativeDragSubscribers.size === 0) {
          stopListening();
        } else {
          nativeUnlisten = stopListening;
        }
      })
      .catch(() => {
        nativeSubscription = null;
        // File pickers and browser tests remain usable without native drag events.
      });
  } catch {
    // No Tauri webview is available in browser-only environments.
  }
}

/**
 * Share one native subscription so higher-priority surfaces can consume a drop
 * before terminal panes see it. Leave events always reach every subscriber.
 */
export function listenToNativeDragDrop(
  handler: NativeDragHandler,
  priority = 0,
): () => void {
  const id = nextSubscriberId++;
  nativeDragSubscribers.set(id, { handler, priority });
  ensureNativeDragSubscription();

  return () => {
    nativeDragSubscribers.delete(id);
    if (nativeDragSubscribers.size === 0 && nativeUnlisten) {
      nativeUnlisten();
      nativeUnlisten = null;
    }
  };
}
