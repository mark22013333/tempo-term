import { describe, expect, it } from "vitest";
import { getTheme } from "@/themes/themes";
import { colorWithAlpha, terminalThemeWithBackground } from "./backgroundTheme";

describe("terminalThemeWithBackground", () => {
  it("applies alpha to short hex, rgb, and other CSS colours", () => {
    expect(colorWithAlpha("#abc", 0.5)).toBe("rgba(170, 187, 204, 0.5)");
    expect(colorWithAlpha("rgb(10, 20, 30)", 0.4)).toBe("rgba(10, 20, 30, 0.4)");
    expect(colorWithAlpha("navy", 0.25)).toBe(
      "color-mix(in srgb, navy 25%, transparent)",
    );
  });

  it("returns the normal opaque theme without a configured background", () => {
    expect(terminalThemeWithBackground("vitesse-dark", 0)).toBe(
      getTheme("vitesse-dark").terminal,
    );
  });

  it("uses a readable translucent surface for dark and light themes", () => {
    expect(terminalThemeWithBackground("vitesse-dark", 20).background).toBe(
      "rgba(34, 34, 34, 0.82)",
    );
    expect(terminalThemeWithBackground("vitesse-light", 20).background).toContain("0.88");
  });

  it("tracks the configured opacity instead of applying a fixed second mask", () => {
    expect(terminalThemeWithBackground("vitesse-dark", 100).background).toBe(
      "rgba(34, 34, 34, 0.1)",
    );
  });

  it("lets a pane host paint the shared header, gutter, and xterm surface once", () => {
    expect(
      terminalThemeWithBackground("vitesse-dark", 35, null, true).background,
    ).toBe("rgba(34, 34, 34, 0)");
  });

  it("uses a custom default foreground without replacing ANSI colours", () => {
    const themed = terminalThemeWithBackground("vitesse-dark", 20, "#f4f7ff");
    expect(themed.foreground).toBe("#f4f7ff");
    expect(themed.red).toBe(getTheme("vitesse-dark").terminal.red);
  });
});
