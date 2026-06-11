const DROPDOWN_OPTION_COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#be123c',
  '#4f46e5',
  '#65a30d',
  '#c2410c',
];

export function getNextDropdownOptionColor(index: number): string {
  return DROPDOWN_OPTION_COLORS[index % DROPDOWN_OPTION_COLORS.length];
}
