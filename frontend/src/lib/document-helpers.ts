import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow } from '@/lib/interfaces';

export type DocBlock = {
  id: string;
  titleField: IField;
  bodyField?: IField;
};

export type CatNode = { id: string; label: string; children?: Array<CatNode> };

export function headerSorter(order: Array<string>) {
  return (a: IField, b: IField): number =>
    order.indexOf(a._id) - order.indexOf(b._id);
}

export function firstCategoryField(
  headers: Array<IField>,
  order: Array<string>,
): IField | undefined {
  return headers
    .filter((h) => !h.trashed)
    .sort(headerSorter(order))
    .find((h) => h.type === E_FIELD_TYPE.CATEGORY);
}

export function buildDepthMap(
  nodes: Array<CatNode>,
  depth = 0,
  map = new Map<string, number>(),
): Map<string, number> {
  for (const n of nodes) {
    map.set(n.id, depth);
    if (n.children?.length) buildDepthMap(n.children, depth + 1, map);
  }
  return map;
}

export function buildLabelMap(
  nodes: Array<CatNode>,
  map = new Map<string, string>(),
): Map<string, string> {
  for (const n of nodes) {
    map.set(n.id, n.label);
    if (n.children?.length) buildLabelMap(n.children, map);
  }
  return map;
}

export function buildDocBlocks(headersOrdered: Array<IField>): Array<DocBlock> {
  const h = headersOrdered.filter((x) => !x.trashed);

  const blocks: Array<DocBlock> = [];

  for (let i = 0; i < h.length; i++) {
    const cur = h[i];
    if (cur.type !== E_FIELD_TYPE.TEXT_SHORT) continue;

    const next = h[i + 1];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!next) continue;

    const bodyField = next.type === E_FIELD_TYPE.TEXT_LONG ? next : undefined;

    blocks.push({
      id: `block-${cur._id}`,
      titleField: cur,
      bodyField,
    });

    if (bodyField) i += 1;
  }

  return blocks;
}

export function getStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export function rowMatchesCategory(
  row: IRow,
  categorySlug: string,
  selectedId: string | null,
): boolean {
  if (!selectedId) return true;
  const v = row[categorySlug];
  if (Array.isArray(v)) return v.includes(selectedId);
  if (typeof v === 'string') return v === selectedId;
  return false;
}
export function rowIndentPxFromLeaf(
  row: IRow,
  categorySlug: string,
  depthMap: Map<string, number>,
): number {
  const v = row[categorySlug];
  let leaf: string | null = null;

  if (Array.isArray(v) && v.length) leaf = v[v.length - 1];
  else if (typeof v === 'string') leaf = v;

  const depth = leaf ? (depthMap.get(leaf) ?? 0) : 0;
  return depth * 16;
}

export function rowLeafLabel(
  row: IRow,
  categorySlug: string,
  labelMap: Map<string, string>,
): string | null {
  const v = (row as any)?.[categorySlug];
  const leaf =
    Array.isArray(v) && v.length
      ? v[v.length - 1]
      : typeof v === 'string'
        ? v
        : null;

  if (!leaf) return null;
  return labelMap.get(leaf) ?? null;
}

export function buildCategoryOrderMap(
  nodes: Array<CatNode>,
  map = new Map<string, number>(),
  counterRef = { i: 0 },
): Map<string, number> {
  for (const n of nodes) {
    map.set(n.id, counterRef.i++);
    if (n.children?.length) buildCategoryOrderMap(n.children, map, counterRef);
  }
  return map;
}

export function getRowLeafId(row: any, categorySlug: string): string | null {
  const v = row?.[categorySlug];
  if (Array.isArray(v) && v.length) return v[v.length - 1];
  if (typeof v === 'string') return v;
  return null;
}
