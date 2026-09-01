import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { isWindowVisible, useWindowVisible } from "./windowActivity";

afterEach(() => vi.restoreAllMocks());

describe("windowActivity", () => {
  it("stays visible when another window takes focus", () => {
    const { result } = renderHook(() => useWindowVisible());

    act(() => window.dispatchEvent(new Event("blur")));

    expect(result.current).toBe(true);
  });

  it("publishes one state transition per visibility change", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get");
    visibility.mockReturnValue("visible");
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useWindowVisible();
    });

    expect(result.current).toBe(true);
    visibility.mockReturnValue("hidden");
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current).toBe(false);
    expect(isWindowVisible()).toBe(false);
    const afterHidden = renders;

    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(renders).toBe(afterHidden);

    visibility.mockReturnValue("visible");
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current).toBe(true);
  });
});
