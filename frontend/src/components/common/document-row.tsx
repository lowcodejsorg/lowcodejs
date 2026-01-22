import { useParams, useRouter } from '@tanstack/react-router';
import { EllipsisVerticalIcon } from 'lucide-react';
import React from 'react';

import { Button } from '../ui/button';

import { DocumentHeadingRow } from './document-heading-row';
import { TableRowTextLongCell } from './table-row-text-long-cell';

import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import type { DocBlock } from '@/lib/document-helpers';
import { getRowLeafId, getStr } from '@/lib/document-helpers';
import type { IRow } from '@/lib/interfaces';

const CATEGORY_FIELD_SLUG = 'category';

interface DocumentRowProps {
  row: IRow;
  blocks: Array<DocBlock>;
  indentPx: number;
  leafLabel?: string | null;
  headingLevel?: number;
  leafIcon?: React.ReactNode;
}

export function DocumentRow({
  row,
  blocks,
  indentPx,
  leafLabel,
  headingLevel,
  leafIcon,
}: DocumentRowProps): React.JSX.Element {
  const router = useRouter();
  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });

  const leafId = getRowLeafId(row, CATEGORY_FIELD_SLUG);

  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

  return (
    <article
      style={{ marginLeft: indentPx }}
      className="my-2  relative"
    >
      {permission.can('UPDATE_ROW') && (
        <div className="flex flex-row justify-end absolute top-0 right-0">
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
            <EllipsisVerticalIcon />
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {leafLabel ? (
          <DocumentHeadingRow
            id={`sec-${leafId}`}
            level={headingLevel ?? 2}
            // icon={leafIcon}
          >
            {leafLabel}
          </DocumentHeadingRow>
        ) : null}
        {blocks.map((b) => {
          const title = getStr(row[b.titleField.slug]).trim();

          const body = b.bodyField ? getStr(row[b.bodyField.slug]).trim() : '';
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
      </div>
    </article>
  );
}
