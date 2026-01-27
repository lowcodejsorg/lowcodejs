import { pdf } from '@react-pdf/renderer';
import { FolderTreeIcon, WorkflowIcon } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { DocumentMain } from '@/components/common/document-main';
import { DocumentPdf } from '@/components/common/document-pdf';
import { DocumentPrintButton } from '@/components/common/document-print-button';
import { DocumentSidebar } from '@/components/common/document-sidebar';
import { DocumentToc } from '@/components/common/document-toc';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
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

export function TableDocumentView({
  data,
  headers,
  order,
  tableSlug,
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

  const table = useReadTable({ slug: tableSlug });

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

  const hasChildrenMap = useMemo(() => {
    const map = new Map<string, boolean>();
    const walk = (nodes: Array<CatNode>): void => {
      for (const n of nodes) {
        map.set(n.id, !!n.children?.length);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(categoryTree);
    return map;
  }, [categoryTree]);

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

  const getLeafIcon = (row: IRow): React.ReactNode | null => {
    if (!categoryField) return null;
    const leafId = getRowLeafId(row, categoryField.slug);
    if (!leafId) return null;
    const hasChildren = hasChildrenMap.get(leafId);
    return hasChildren ? (
      <FolderTreeIcon className="size-4" />
    ) : (
      <WorkflowIcon className="size-4" />
    );
  };

  async function handlePrint(): Promise<void> {
    const blob = await pdf(
      <DocumentPdf
        title={table.data?.name ?? ''}
        categoryTitle={categoryField?.name ?? 'Sumario'}
        nodes={categoryTree}
        rows={sortedRows}
        blocks={docBlocks}
        categorySlug={categoryField?.slug ?? 'category'}
        getLeafLabel={getLeafLabel}
        getHeadingLevel={getHeadingLevel}
        getIndentPx={getIndentPx}
      />,
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableSlug}-document.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-row h-[calc(100vh-64px)] gap-4 relative w-full overflow-hidden">
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

      <div className="w-full flex-1 min-w-0 overflow-y-auto">
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
          getLeafIcon={getLeafIcon}
        />
      </div>
    </div>
  );
}
