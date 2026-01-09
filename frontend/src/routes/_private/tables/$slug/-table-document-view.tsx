import React, { useMemo, useState } from 'react';
import type { IField, IRow } from '@/lib/interfaces';
import {
  firstCategoryField,
  buildDepthMap,
  buildLabelMap,
  buildDocBlocks,
  headerSorter,
  rowMatchesCategory,
  rowIndentPxFromLeaf,
  rowLeafLabel,
  type CatNode,
  buildCategoryOrderMap,
  getRowLeafId,
} from '@/lib/document-helpers';

import { DocumentSidebar } from '@/components/common/document-sidebar';
import { DocumentMain } from '@/components/common/document-main';

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
  const categoryField = useMemo(() => firstCategoryField(headers, order), [headers, order]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const orderedHeaders = useMemo(
    () => headers.filter((h) => !h.trashed).sort(headerSorter(order)),
    [headers, order]
  );

  const docBlocks = useMemo(() => buildDocBlocks(orderedHeaders), [orderedHeaders]);

  const categoryTree: CatNode[] = useMemo(() => {
    if (!categoryField) return [];
    return (categoryField.configuration?.category ?? []) as CatNode[];
  }, [categoryField]);

  const depthMap = useMemo(() => buildDepthMap(categoryTree), [categoryTree]);
  const labelMap = useMemo(() => buildLabelMap(categoryTree), [categoryTree]);

  const filteredRows = useMemo(() => {
    if (!categoryField) return data;
    return data.filter((row) => rowMatchesCategory(row, categoryField.slug, selectedCategoryId));
  }, [data, categoryField, selectedCategoryId]);

  const filterLabel = selectedCategoryId
    ? labelMap.get(selectedCategoryId) ?? selectedCategoryId
    : null;

  const getIndentPx = (row: IRow) =>
    categoryField ? rowIndentPxFromLeaf(row, categoryField.slug, depthMap) : 0;

  const getLeafLabel = (row: IRow) =>
    categoryField ? rowLeafLabel(row, categoryField.slug, labelMap) : null;

  const categoryOrderMap = useMemo(
    () => buildCategoryOrderMap(categoryTree),
    [categoryTree]
  );
  
  const sortedRows = useMemo(() => {
    if (!categoryField) return filteredRows;
  
    const slug = categoryField.slug;
  
    return [...filteredRows].sort((a, b) => {
      const leafA = getRowLeafId(a as any, slug);
      const leafB = getRowLeafId(b as any, slug);
  
      const ordA = leafA ? (categoryOrderMap.get(leafA) ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
      const ordB = leafB ? (categoryOrderMap.get(leafB) ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
  
      if (ordA !== ordB) return ordA - ordB;

      return String(a._id).localeCompare(String(b._id));
    });
  }, [filteredRows, categoryField, categoryOrderMap]);
  

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] min-h-[calc(100vh-64px)]">

      {categoryField ? (
        <DocumentSidebar
          subtitle={`Por: ${categoryField.name}`}
          nodes={categoryTree}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      ) : (
        <DocumentSidebar
          subtitle={`Por`}
          nodes={categoryTree}  
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      )}

      <DocumentMain
        rows={sortedRows}
        total={data.length}
        filterLabel={filterLabel}
        blocks={docBlocks}
        getIndentPx={getIndentPx}
        getLeafLabel={getLeafLabel}
      />
    </div>
  );
}
