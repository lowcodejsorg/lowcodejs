import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TableRowBadgeListProps<T> {
  values: Array<T>;
  renderLabel: (value: T, index: number) => React.ReactNode;
  getKey?: (value: T, index: number) => string | number;
  getColor?: (value: T, index: number) => string | null | undefined;
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

function getContrastTextColor(rgb: { r: number; g: number; b: number }): string {
  // O fundo é renderizado a ~20% sobre o surface (branco em modo claro), então
  // o texto precisa de boa legibilidade contra um tom claro. Usamos a versão
  // escurecida da própria cor: mantém identidade visual e garante contraste.
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

  const textColor = getContrastTextColor(rgb);

  return {
    color: textColor,
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`,
    fontWeight: 500,
  };
}

export function TableRowBadgeList<T>({
  values,
  renderLabel,
  getKey = (_: T, i: number): string | number => i,
  getColor,
}: TableRowBadgeListProps<T>): React.JSX.Element {
  if (values.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <div
      data-slot="table-row-badge-list"
      data-test-id="badge-list"
      className="inline-flex flex-wrap gap-1"
    >
      {values.map((value, index) => {
        const color = getColor?.(value, index);
        const style = badgeStyleFromColor(color);
        return (
          <Badge
            key={getKey(value, index)}
            variant="outline"
            className={cn(!style && 'text-muted-foreground')}
            style={style}
          >
            {renderLabel(value, index)}
          </Badge>
        );
      })}
    </div>
  );
}
