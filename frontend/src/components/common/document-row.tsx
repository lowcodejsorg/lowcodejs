import { useParams, useRouter } from '@tanstack/react-router';
import { PencilIcon, PlusIcon } from 'lucide-react';
import React from 'react';

import { Button } from '../ui/button';

import { DocumentHeadingRow } from './document-heading-row';
import { TableRowTextLongCell } from './table-row-text-long-cell';

import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import type { DocBlock } from '@/lib/document-helpers';
import { getRowLeafId, getStr } from '@/lib/document-helpers';
import type { IRow } from '@/lib/interfaces';

interface DocumentRowProps {
  row: IRow;
  blocks: Array<DocBlock>;
  indentPx: number;
  leafLabel?: string | null;
  headingLevel?: number;
  leafIcon?: React.ReactNode;
  categorySlug: string;
  showHeading?: boolean;
}

export function DocumentRow({
  row,
  blocks,
  indentPx,
  leafLabel,
  headingLevel,
  leafIcon,
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

  return (
    <article
      style={{ marginLeft: indentPx }}
      className="my-2  relative"
    >
      <div className="space-y-4">
        {showHeading && leafLabel ? (
          <DocumentHeadingRow
            id={`sec-${leafId}`}
            level={headingLevel ?? 2}
            // icon={leafIcon}
            actions={
              permission.can('CREATE_ROW') && leafId ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="p-1 cursor-pointer"
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
              ) : null
            }
          >
            {leafLabel}
          </DocumentHeadingRow>
        ) : null}
        <div className="relative pr-8">
          {permission.can('UPDATE_ROW') && (
            <div className="absolute top-0 right-0">
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
        </div>
      </div>
    </article>
  );
}
