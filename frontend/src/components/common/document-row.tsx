import { useParams, useRouter } from '@tanstack/react-router';
import { PencilIcon, PlusIcon } from 'lucide-react';
import React from 'react';

import { Button } from '../ui/button';

import { DocumentHeadingRow } from './document-heading-row';
import { TableRowCategoryCell } from './table-row-category-cell';
import { TableRowDateCell } from './table-row-date-cell';
import { TableRowDropdownCell } from './table-row-dropdown-cell';
import { TableRowEvaluationCell } from './table-row-evaluation-cell';
import { TableRowFieldGroupCell } from './table-row-field-group-cell';
import { TableRowFileCell } from './table-row-file-cell';
import { TableRowReactionCell } from './table-row-reaction-cell';
import { TableRowRelationshipCell } from './table-row-relationship-cell';
import { TableRowTextLongCell } from './table-row-text-long-cell';
import { TableRowTextShortCell } from './table-row-text-short-cell';
import { TableRowUserCell } from './table-row-user-cell';

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
      style={{ marginLeft: indentPx }}
      className="my-6 relative"
    >
      <div className="space-y-4">
        {showHeading && leafLabel ? (
          <DocumentHeadingRow
            id={`sec-${leafId}`}
            level={headingLevel ?? 2}
            actions={
              permission.can('CREATE_ROW') && leafId ? (
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
              ) : undefined
            }
          >
            {leafLabel}
          </DocumentHeadingRow>
        ) : null}
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

            const body = b.bodyField
              ? getStr(row[b.bodyField.slug]).trim()
              : '';
            if (!body) return null;

            return (
              <section
                key={`${row._id}-${b.id}`}
                className="space-y-2"
              >
                {title ? (
                  <h2 className="text-base font-semibold leading-none text-gray-700">
                    {title}
                  </h2>
                ) : null}
                {b.bodyField ? (
                  <TableRowTextLongCell
                    field={b.bodyField}
                    row={row}
                  />
                ) : null}
              </section>
            );
          })}
          {extraFields.length > 0 &&
            extraFields.map((field) => (
              <div key={field._id}>{renderFieldCell(field, row, slug)}</div>
            ))}
        </div>
      </div>
    </article>
  );
}
