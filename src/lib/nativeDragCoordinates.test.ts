import { describe, expect, it, vi } from "vitest";
import { nativePointInElement } from "./nativeDragCoordinates";

function elementWithRect(): Element {
  const element = document.createElement("div");
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    left: 10,
    top: 20,
    right: 210,
    bottom: 120,
    width: 200,
    height: 100,
    x: 10,
    y: 20,
    toJSON: () => ({}),
  });
  return element;
}

describe("nativePointInElement", () => {
  it("accepts logical coordinates inside the target", () => {
    expect(nativePointInElement(elementWithRect(), 100, 80, 2, false)).toBe(true);
  });

  it("converts physical coordinates on scaled displays", () => {
    expect(nativePointInElement(elementWithRect(), 200, 160, 2, true)).toBe(true);
  });

  it("does not also accept the raw physical point as a logical point", () => {
    expect(nativePointInElement(elementWithRect(), 400, 200, 2, true)).toBe(true);
    expect(nativePointInElement(elementWithRect(), 400, 200, 2, false)).toBe(false);
  });

  it("rejects points outside the target", () => {
    expect(nativePointInElement(elementWithRect(), 800, 600, 2, true)).toBe(false);
  });
});
