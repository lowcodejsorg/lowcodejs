import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import Html from 'react-pdf-html';

import { E_FIELD_FORMAT } from '@/lib/constant';
import type { CatNode, DocBlock } from '@/lib/document-helpers';
import { getRowLeafId, getStr } from '@/lib/document-helpers';
import type { IRow } from '@/lib/interfaces';

type TocItem = { id: string; label: string; level: number };

function flatten(nodes: Array<CatNode>, level: number = 1): Array<TocItem> {
  const out: Array<TocItem> = [];
  for (const n of nodes) {
    out.push({ id: n.id, label: n.label, level });
    if (n.children?.length) out.push(...flatten(n.children, level + 1));
  }
  return out;
}

function headingFontSize(level: number): number {
  if (level <= 2) return 16;
  if (level === 3) return 14;
  if (level === 4) return 12;
  if (level === 5) return 11;
  return 10;
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  tocTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  docTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tocItem: {
    marginBottom: 4,
  },
  tocLink: {
    textDecoration: 'none',
    color: '#111827',
    backgroundColor: 'transparent',
  },
  tocLabel: {
    fontSize: 11,
    backgroundColor: 'transparent',
  },
  section: {
    marginBottom: 12,
  },
  heading: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  blockBody: {
    fontSize: 10,
    color: '#4B5563',
    lineHeight: 1.4,
    marginBottom: 8,
  },
});

export function DocumentPdf({
  title,
  categoryTitle,
  nodes,
  rows,
  blocks,
  categorySlug,
  getLeafLabel,
  getHeadingLevel,
  getIndentPx,
}: {
  title: string;
  categoryTitle: string;
  nodes: Array<CatNode>;
  rows: Array<IRow>;
  blocks: Array<DocBlock>;
  categorySlug: string;
  getLeafLabel: (row: IRow) => string | null;
  getHeadingLevel: (row: IRow) => number;
  getIndentPx: (row: IRow) => number;
}): React.JSX.Element {
  const tocItems = flatten(nodes);
  const tocIdSet = new Set(tocItems.map((it) => String(it.id)));
  const renderedLeafIds = new Set<string>();

  return (
    <Document>
      <Page
        size="A4"
        style={styles.page}
        wrap
      >
        <Text style={styles.docTitle}>{title}</Text>
        {tocItems.length ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.tocTitle}>{categoryTitle}</Text>
            {tocItems.map((it) => (
              <View
                key={it.id}
                style={[styles.tocItem, { marginLeft: (it.level - 1) * 12 }]}
              >
                <Link
                  src={`#sec-${it.id}`}
                  style={styles.tocLink}
                >
                  <Text style={styles.tocLabel}>{it.label}</Text>
                </Link>
              </View>
            ))}
          </View>
        ) : null}
        {rows.map((row) => {
          const leafLabel = getLeafLabel(row);
          const leafIdRaw = leafLabel ? getRowLeafId(row, categorySlug) : null;
          const leafId = leafIdRaw != null ? String(leafIdRaw) : null;
          const isAnchorHeading =
            leafId && tocIdSet.has(leafId) && !renderedLeafIds.has(leafId);
          if (leafId) renderedLeafIds.add(leafId);
          const indent = Math.round(getIndentPx(row) * 0.75);
          const headingLevel = getHeadingLevel(row);

          return (
            <View
              key={row._id}
              id={isAnchorHeading && leafId ? `sec-${leafId}` : undefined}
              style={[styles.section, indent ? { marginLeft: indent } : {}]}
            >
              {leafLabel && leafId ? (
                <Text
                  style={[
                    styles.heading,
                    { fontSize: headingFontSize(headingLevel) },
                  ]}
                >
                  {leafLabel}
                </Text>
              ) : null}

              {blocks.map((b) => {
                if (!b.bodyField) return null;
                const titleRaw = getStr(row[b.titleField.slug]).trim();
                const bodyRaw = getStr(row[b.bodyField.slug]).trim();
                if (!bodyRaw) return null;

                return (
                  <View key={`${row._id}-${b.id}`}>
                    {titleRaw ? (
                      <Text style={styles.blockTitle}>{titleRaw}</Text>
                    ) : null}
                    {b.bodyField.configuration.format ===
                    E_FIELD_FORMAT.RICH_TEXT ? (
                      <Html
                        style={styles.blockBody}
                        renderersProps={{
                          a: { style: { textDecoration: 'none' } },
                        }}
                      >
                        {bodyRaw}
                      </Html>
                    ) : (
                      <Text style={styles.blockBody}>{bodyRaw}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
