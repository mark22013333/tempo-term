import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchSystemStats } = vi.hoisted(() => ({ fetchSystemStats: vi.fn() }));
const windowState = vi.hoisted(() => ({ visible: true }));
vi.mock("./sysinfoBridge", () => ({ fetchSystemStats }));
vi.mock("@/lib/windowActivity", () => ({ useWindowVisible: () => windowState.visible }));

import { useSystemStats } from "./useSystemStats";

const sample = { cpuUsage: 42, ramUsed: 8, ramTotal: 16, netRx: 1024, netTx: 512 };

beforeEach(() => {
  windowState.visible = true;
  fetchSystemStats.mockReset();
  fetchSystemStats.mockResolvedValue(sample);
});

afterEach(() => vi.useRealTimers());

describe("useSystemStats", () => {
  it("returns null before the first sample, then the latest stats", async () => {
    const { result } = renderHook(() => useSystemStats());
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual(sample));
  });

  it("stops polling while hidden and resumes with one immediate poll", async () => {
    vi.useFakeTimers();
    const { rerender } = renderHook(() => useSystemStats());
    await act(async () => Promise.resolve());
    expect(fetchSystemStats).toHaveBeenCalledTimes(1);

    windowState.visible = false;
    rerender();
    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(fetchSystemStats).toHaveBeenCalledTimes(1);

    windowState.visible = true;
    rerender();
    await act(async () => Promise.resolve());
    expect(fetchSystemStats).toHaveBeenCalledTimes(2);

    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(fetchSystemStats).toHaveBeenCalledTimes(3);
  });
});
