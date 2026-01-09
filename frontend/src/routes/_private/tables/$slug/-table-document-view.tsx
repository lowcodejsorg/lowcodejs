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
        rows={filteredRows}
        total={data.length}
        filterLabel={filterLabel}
        blocks={docBlocks}
        getIndentPx={getIndentPx}
        getLeafLabel={getLeafLabel}
      />
    </div>
  );
}
