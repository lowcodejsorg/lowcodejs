// Utilitários para estilos de badge de dropdown e badge list
import type React from 'react';

function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export function getDropdownContrastStyle(
  color?: string | null,
): React.CSSProperties | undefined {
  if (!color) return undefined;
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(
    color.trim(),
  );
  if (!match) return undefined;
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);

  const dark = isDarkMode();

  if (dark) {
    // Dark mode: clarear a cor para texto, usar fundo mais translúcido
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const lightenFactor = Math.max(1.3, 2.2 - luminance * 0.8);
    const tr = Math.min(255, Math.round(r * lightenFactor));
    const tg = Math.min(255, Math.round(g * lightenFactor));
    const tb = Math.min(255, Math.round(b * lightenFactor));

    return {
      color: `rgb(${tr}, ${tg}, ${tb})`,
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.18)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.4)`,
      fontWeight: 600,
    };
  }

  // Light mode: escurecer a cor para texto (comportamento original)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const factor = Math.max(0.15, 0.5 - luminance * 0.45);
  const tr = Math.round(r * factor);
  const tg = Math.round(g * factor);
  const tb = Math.round(b * factor);

  return {
    color: `rgb(${tr}, ${tg}, ${tb})`,
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.32)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.65)`,
    fontWeight: 600,
  };
}

export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function getContrastTextColor(
  rgb: { r: number; g: number; b: number },
  dark?: boolean,
): string {
  if (dark) {
    // Dark mode: clarear a cor para legibilidade em fundo escuro
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    const lightenFactor = Math.max(1.3, 2.2 - luminance * 0.8);
    const r = Math.min(255, Math.round(rgb.r * lightenFactor));
    const g = Math.min(255, Math.round(rgb.g * lightenFactor));
    const b = Math.min(255, Math.round(rgb.b * lightenFactor));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Light mode: escurecer a cor (comportamento original)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const darkenFactor = Math.max(0.22, 0.85 - luminance * 0.6);
  const r = Math.round(rgb.r * darkenFactor);
  const g = Math.round(rgb.g * darkenFactor);
  const b = Math.round(rgb.b * darkenFactor);
  return `rgb(${r}, ${g}, ${b})`;
}

export function badgeStyleFromColor(
  color?: string | null,
): React.CSSProperties | undefined {
  if (!color) return undefined;
  const rgb = hexToRgb(color);
  if (!rgb) return undefined;
  const dark = isDarkMode();
  const textColor = getContrastTextColor(rgb, dark);

  if (dark) {
    return {
      color: textColor,
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`,
      borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
      fontWeight: 500,
    };
  }

  return {
    color: textColor,
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`,
    fontWeight: 500,
  };
}
