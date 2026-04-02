import { useParams, useRouter } from '@tanstack/react-router';
import { ChevronDownIcon, PencilIcon, PlusIcon } from 'lucide-react';
import React from 'react';

import { DocumentHeadingRow } from './document-heading-row';

import { TableRowCategoryCell } from '@/components/common/dynamic-table/table-cells/table-row-category-cell';
import { TableRowDateCell } from '@/components/common/dynamic-table/table-cells/table-row-date-cell';
import { TableRowDropdownCell } from '@/components/common/dynamic-table/table-cells/table-row-dropdown-cell';
import { TableRowEvaluationCell } from '@/components/common/dynamic-table/table-cells/table-row-evaluation-cell';
import { TableRowFieldGroupCell } from '@/components/common/dynamic-table/table-cells/table-row-field-group-cell';
import { TableRowFileCell } from '@/components/common/dynamic-table/table-cells/table-row-file-cell';
import { TableRowReactionCell } from '@/components/common/dynamic-table/table-cells/table-row-reaction-cell';
import { TableRowRelationshipCell } from '@/components/common/dynamic-table/table-cells/table-row-relationship-cell';
import { TableRowTextLongCell } from '@/components/common/dynamic-table/table-cells/table-row-text-long-cell';
import { TableRowTextShortCell } from '@/components/common/dynamic-table/table-cells/table-row-text-short-cell';
import { TableRowUserCell } from '@/components/common/dynamic-table/table-cells/table-row-user-cell';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { DocBlock } from '@/lib/document-helpers';
import { getRowLeafId, getStr, headerSorter } from '@/lib/document-helpers';
import type { IField, IRow } from '@/lib/interfaces';

interface DocumentRowProps {
  row: IRow;
  blocks: Array<DocBlock>;
  indentPx: number;
  leafLabel?: string | null;
  headingLevel?: number;
  categorySlug: string;
  showHeading?: boolean;
}

function hasFieldValue(field: IField, row: IRow): boolean {
  const value = row[field.slug];
  if (value == null) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function renderFieldCell(
  field: IField,
  row: IRow,
  tableSlug: string,
): React.JSX.Element {
  switch (field.type) {
    case E_FIELD_TYPE.TEXT_SHORT:
      return (
        <TableRowTextShortCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.TEXT_LONG:
      return (
        <TableRowTextLongCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.DATE:
      return (
        <TableRowDateCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.DROPDOWN:
      return (
        <TableRowDropdownCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.FILE:
      return (
        <TableRowFileCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.RELATIONSHIP:
      return (
        <TableRowRelationshipCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.CATEGORY:
      return (
        <TableRowCategoryCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.EVALUATION:
      return (
        <TableRowEvaluationCell
          row={row}
          field={field}
          tableSlug={tableSlug}
        />
      );
    case E_FIELD_TYPE.REACTION:
      return (
        <TableRowReactionCell
          row={row}
          field={field}
          tableSlug={tableSlug}
        />
      );
    case E_FIELD_TYPE.FIELD_GROUP:
      return (
        <TableRowFieldGroupCell
          row={row}
          field={field}
          tableSlug={tableSlug}
        />
      );
    case E_FIELD_TYPE.USER:
      return (
        <TableRowUserCell
          row={row}
          field={field}
        />
      );
    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}

export function DocumentRow({
  row,
  blocks,
  indentPx,
  leafLabel,
  headingLevel,
  categorySlug,
  showHeading = true,
}: DocumentRowProps): React.JSX.Element {
  const router = useRouter();
  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });

  const leafId = getRowLeafId(row, categorySlug);

  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

  const docBlockSlugs = new Set<string>();
  for (const b of blocks) {
    if (b.titleField) docBlockSlugs.add(b.titleField.slug);
    if (b.bodyField) docBlockSlugs.add(b.bodyField.slug);
  }

  const extraFields = React.useMemo(() => {
    if (!table.data) return [];
    const fields = table.data.fields.filter(
      (field) =>
        !field.trashed &&
        !field.native &&
        field.showInDetail &&
        !docBlockSlugs.has(field.slug) &&
        field.slug !== categorySlug,
    );
    return fields.sort(headerSorter(table.data.fieldOrderList));
  }, [table.data, categorySlug, blocks]);

  return (
    <article
      data-slot="document-row"
      style={{ marginLeft: indentPx }}
      className="my-6 relative"
    >
      <div className="space-y-4">
        {showHeading &&
          leafLabel &&
          ((): React.ReactNode => {
            let headingActions: React.ReactNode = undefined;
            if (permission.can('CREATE_ROW') && leafId) {
              headingActions = (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer opacity-40 hover:opacity-100"
                  aria-label="Adicionar registro nesta seção"
                  onClick={() => {
                    router.navigate({
                      to: '/tables/$slug/row/create',
                      params: { slug },
                      search: {
                        categoryId: leafId,
                        categorySlug,
                      },
                    });
                  }}
                >
                  <PlusIcon className="size-4" />
                </Button>
              );
            }
            return (
              <DocumentHeadingRow
                id={`sec-${leafId}`}
                level={headingLevel ?? 2}
                actions={headingActions}
              >
                {leafLabel}
              </DocumentHeadingRow>
            );
          })()}
        <div className="relative pr-8">
          {permission.can('UPDATE_ROW') && (
            <div className="absolute top-0 right-0 no-print">
              <Button
                variant="ghost"
                className="p-0 cursor-pointer"
                onClick={() => {
                  router.navigate({
                    to: '/tables/$slug/row/$rowId',
                    params: { slug, rowId: row._id },
                  });
                }}
              >
                <PencilIcon />
              </Button>
            </div>
          )}
          {blocks.map((b) => {
            const title = getStr(row[b.titleField.slug]).trim();

            let body = '';
            if (b.bodyField) {
              body = getStr(row[b.bodyField.slug]).trim();
            }
            if (!body) return null;

            return (
              <section
                key={`${row._id}-${b.id}`}
                className="space-y-2"
              >
                {title && (
                  <h2 className="text-base font-semibold leading-none text-gray-700">
                    {title}
                  </h2>
                )}
                {b.bodyField && (
                  <TableRowTextLongCell
                    field={b.bodyField}
                    row={row}
                  />
                )}
              </section>
            );
          })}
          {((): React.JSX.Element | null => {
            const visibleExtra = extraFields.filter((field) =>
              hasFieldValue(field, row),
            );
            if (visibleExtra.length === 0) return null;
            if (visibleExtra.length === 1)
              return (
                <div className="mt-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {visibleExtra[0].name}
                  </span>
                  {renderFieldCell(visibleExtra[0], row, slug)}
                </div>
              );
            return (
              <Collapsible className="mt-2">
                <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors [&[data-state=open]>svg]:rotate-180">
                  <ChevronDownIcon className="size-3.5 transition-transform" />
                  Mais informações
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1.5">
                  {visibleExtra.map((field) => (
                    <div key={field._id}>
                      <span className="text-xs font-medium text-muted-foreground">
                        {field.name}
                      </span>
                      {renderFieldCell(field, row, slug)}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })()}
        </div>
      </div>
    </article>
  );
}
