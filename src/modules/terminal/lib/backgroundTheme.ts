import type { ITheme } from "@xterm/xterm";
import { backgroundSurfaceAlphas } from "@/lib/backgroundAppearance";
import { getTheme } from "@/themes/themes";

export function colorWithAlpha(color: string, alpha: number): string {
  const longHex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})(?:[0-9a-f]{2})?$/i.exec(
    color,
  );
  const shortHex = /^#([0-9a-f])([0-9a-f])([0-9a-f])(?:[0-9a-f])?$/i.exec(color);
  const hex = longHex ?? shortHex;
  if (hex) {
    const [, red, green, blue] = hex;
    const expand = (channel: string) => (channel.length === 1 ? channel.repeat(2) : channel);
    return `rgba(${Number.parseInt(expand(red), 16)}, ${Number.parseInt(
      expand(green),
      16,
    )}, ${Number.parseInt(expand(blue), 16)}, ${alpha})`;
  }

  const rgb = /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,[^)]+)?\)$/i.exec(
    color,
  );
  if (rgb) {
    return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
  }

  return `color-mix(in srgb, ${color} ${alpha * 100}%, transparent)`;
}

/** Keep xterm's palette intact while letting the app-managed image show through. */
export function terminalThemeWithBackground(
  themeId: string,
  backgroundOpacity: number,
  textColor: string | null = null,
  backgroundPaintedByHost = false,
): ITheme {
  const theme = getTheme(themeId);
  if (backgroundOpacity <= 0 || !theme.terminal.background) {
    return theme.terminal;
  }
  return {
    ...theme.terminal,
    background: colorWithAlpha(
      theme.terminal.background,
      backgroundPaintedByHost
        ? 0
        : backgroundSurfaceAlphas(themeId, backgroundOpacity).surface,
    ),
    ...(textColor ? { foreground: textColor } : {}),
  };
}
