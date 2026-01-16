import React, { useMemo, useRef, useState } from 'react';
import * as ReactToPrint from 'react-to-print';

import { DocumentMain } from '@/components/common/document-main';
import { DocumentPrintButton } from '@/components/common/document-print-button';
import { DocumentSidebar } from '@/components/common/document-sidebar';
import { DocumentToc } from '@/components/common/document-toc';
import type { CatNode } from '@/lib/document-helpers';
import {
  buildCategoryOrderMap,
  buildDepthMap,
  buildDescendantsMap,
  buildDocBlocks,
  buildLabelMap,
  firstCategoryField,
  getRowLeafId,
  headerSorter,
  rowHeadingLevelFromLeaf,
  rowIndentPxFromLeaf,
  rowLeafLabel,
  rowMatchesCategory,
} from '@/lib/document-helpers';
import type { IField, IRow } from '@/lib/interfaces';

const { useReactToPrint } = ReactToPrint;

export function TableDocumentView({
  data,
  headers,
  order,
}: {
  data: Array<IRow>;
  headers: Array<IField>;
  order: Array<string>;
  tableSlug: string;
}): React.ReactElement {
  const categoryField = useMemo(
    () => firstCategoryField(headers, order),
    [headers, order],
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const orderedHeaders = useMemo(
    () => headers.filter((h) => !h.trashed).sort(headerSorter(order)),
    [headers, order],
  );

  const docBlocks = useMemo(
    () => buildDocBlocks(orderedHeaders),
    [orderedHeaders],
  );

  const categoryTree: Array<CatNode> = useMemo(() => {
    if (!categoryField) return [];
    return categoryField.configuration.category as Array<CatNode>;
  }, [categoryField]);

  const depthMap = useMemo(() => buildDepthMap(categoryTree), [categoryTree]);
  const labelMap = useMemo(() => buildLabelMap(categoryTree), [categoryTree]);

  const descendantsMap = useMemo(
    () => buildDescendantsMap(categoryTree),
    [categoryTree],
  );

  const filteredRows = useMemo(() => {
    if (!categoryField) return data;

    return data.filter((row) =>
      rowMatchesCategory(
        row,
        categoryField.slug,
        selectedCategoryId,
        descendantsMap,
      ),
    );
  }, [data, categoryField, selectedCategoryId, descendantsMap]);

  const filterLabel = selectedCategoryId
    ? (labelMap.get(selectedCategoryId) ?? selectedCategoryId)
    : null;

  const getIndentPx = (row: IRow): number =>
    categoryField ? rowIndentPxFromLeaf(row, categoryField.slug, depthMap) : 0;

  const getLeafLabel = (row: IRow): string | null =>
    categoryField ? rowLeafLabel(row, categoryField.slug, labelMap) : null;

  const categoryOrderMap = useMemo(
    () => buildCategoryOrderMap(categoryTree),
    [categoryTree],
  );

  const sortedRows = useMemo(() => {
    if (!categoryField) return filteredRows;

    const slug = categoryField.slug;

    return [...filteredRows].sort((a, b) => {
      const leafA = getRowLeafId(a, slug);
      const leafB = getRowLeafId(b, slug);

      const ordA = leafA
        ? (categoryOrderMap.get(leafA) ?? Number.POSITIVE_INFINITY)
        : Number.POSITIVE_INFINITY;
      const ordB = leafB
        ? (categoryOrderMap.get(leafB) ?? Number.POSITIVE_INFINITY)
        : Number.POSITIVE_INFINITY;

      if (ordA !== ordB) return ordA - ordB;

      return String(a._id).localeCompare(String(b._id));
    });
  }, [filteredRows, categoryField, categoryOrderMap]);

  const getHeadingLevel = (row: IRow): number =>
    categoryField
      ? rowHeadingLevelFromLeaf(row, categoryField.slug, depthMap)
      : 2;

  const contentRef = useRef<HTMLDivElement>(null);

  const printPdf = useReactToPrint({ contentRef });
  function handlePrint(): void {
    printPdf();
  }

  return (
    <div className="flex flex-row min-h-[calc(100vh-64px)] gap-4 relative w-full">
      <DocumentPrintButton onClick={handlePrint} />

      <DocumentSidebar
        subtitle={`Por: ${categoryField?.name}`}
        nodes={categoryTree}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((v) => !v)}
        categoryField={categoryField ?? ({} as IField)}
      />

      <div
        ref={contentRef}
        className="w-full"
      >
        <DocumentToc
          nodes={categoryTree}
          title={categoryField?.name ?? 'Sumário'}
        />
        <DocumentMain
          rows={sortedRows}
          total={data.length}
          filterLabel={filterLabel}
          blocks={docBlocks}
          getIndentPx={getIndentPx}
          getLeafLabel={getLeafLabel}
          getHeadingLevel={getHeadingLevel}
        />
      </div>
    </div>
  );
}
