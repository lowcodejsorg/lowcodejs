import * as React from 'react';

import { Badge } from '@/components/ui/badge';

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

export function badgeStyleFromColor(
  color?: string | null,
): React.CSSProperties | undefined {
  if (!color) return undefined;
  const rgb = hexToRgb(color);
  if (!rgb) return undefined;

  return {
    color,
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`,
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
    <div className="inline-flex flex-wrap gap-1">
      {values.map((value, index) => {
        const color = getColor?.(value, index);
        const style = badgeStyleFromColor(color);
        return (
          <Badge
            key={getKey(value, index)}
            variant="outline"
            className={style ? '' : 'text-muted-foreground'}
            style={style}
          >
            {renderLabel(value, index)}
          </Badge>
        );
      })}
    </div>
  );
}
