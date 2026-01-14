import React from 'react';
import { useParams, useRouter } from '@tanstack/react-router';
import type { IField, IRow } from '@/lib/interfaces';
import { HeaderFilter, HeaderSorter } from '@/lib/layout-pickers';
import { TableRowTextShortCell } from '@/components/common/table-row-text-short-cell';
import { TableRowTextLongCell } from '@/components/common/table-row-text-long-cell';
import { E_FIELD_TYPE } from '@/lib/constant';
import { TableRowDateCell } from '@/components/common/table-row-date-cell';
import { TableRowDropdownCell } from '@/components/common/table-row-dropdown-cell';
import { TableRowRelationshipCell } from '@/components/common/table-row-relationship-cell';
import { TableRowCategoryCell } from '@/components/common/table-row-category-cell';
import { TableRowFileCell } from '@/components/common/table-row-file-cell';
import { TableRowFieldGroupCell } from '@/components/common/table-row-field-group-cell';
import { TableRowReactionCell } from '@/components/common/table-row-reaction-cell';
import { TableRowEvaluationCell } from '@/components/common/table-row-evaluation-cell';

interface Props {
  data: Array<IRow>;
  headers: Array<IField>;
  order: Array<string>;
}

interface RenderCardCellProps {
  field: IField;
  row: IRow;
  tableSlug: string;
}

function RenderCardCell({
  field,
  row,
  tableSlug,
}: RenderCardCellProps): React.JSX.Element {
  if (!(field.slug in row)) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">
          {field.name}
        </span>
        <span className="text-muted-foreground text-sm">-</span>
      </div>
    );
  }

  const renderContent = (): React.JSX.Element => {
    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
        return (
          <TableRowTextShortCell
            field={field}
            row={row}
          />
        );
      case E_FIELD_TYPE.TEXT_LONG:
        return (
          <TableRowTextLongCell
            field={field}
            row={row}
          />
        );
      case E_FIELD_TYPE.DATE:
        return (
          <TableRowDateCell
            field={field}
            row={row}
          />
        );
      case E_FIELD_TYPE.DROPDOWN:
        return (
          <TableRowDropdownCell
            field={field}
            row={row}
          />
        );
      case E_FIELD_TYPE.CATEGORY:
        return (
          <TableRowCategoryCell
            field={field}
            row={row}
          />
        );
      case E_FIELD_TYPE.RELATIONSHIP:
        return (
          <TableRowRelationshipCell
            field={field}
            row={row}
          />
        );
      case E_FIELD_TYPE.FILE:
        return (
          <TableRowFileCell
            field={field}
            row={row}
            isCardOrMosaic
          />
        );
      case E_FIELD_TYPE.FIELD_GROUP:
        return (
          <TableRowFieldGroupCell
            field={field}
            row={row}
            tableSlug={tableSlug}
          />
        );
      case E_FIELD_TYPE.REACTION:
        return (
          <TableRowReactionCell
            field={field}
            row={row}
            tableSlug={tableSlug}
          />
        );
      case E_FIELD_TYPE.EVALUATION:
        return (
          <TableRowEvaluationCell
            field={field}
            row={row}
            tableSlug={tableSlug}
          />
        );
      default:
        return <span className="text-muted-foreground text-sm">-</span>;
    }
  };

  return <div className="flex flex-col gap-0.5">{renderContent()}</div>;
}

export function TableCardView({ data, headers, order }: Props) {
  const router = useRouter();
  const { slug } = useParams({ from: '/_private/tables/$slug/' });

  const visibleHeaders = headers.filter(HeaderFilter).sort(HeaderSorter(order));

  const thumbField = visibleHeaders.find((f) => f.type === 'FILE');
  const titleField = visibleHeaders.find((f) => f.type === 'TEXT_SHORT');
  const descField = visibleHeaders.find((f) => f.type === 'TEXT_LONG');

  const used = new Set(
    [thumbField?._id, titleField?._id, descField?._id].filter(
      Boolean,
    ) as string[],
  );
  const extraFields = visibleHeaders.filter((f) => !used.has(f._id));

  return (
    <div className="divide-y divide-border/50">
      {data.map((row) => (
        <article
          key={row._id}
          className="py-4 cursor-pointer hover:bg-muted/30 rounded-xl px-2"
          onClick={() => {
            router.navigate({
              to: '/tables/$slug/row/$rowId',
              params: { slug, rowId: row._id },
            });
          }}
        >
          <div className="flex gap-4">
            <div className="w-[200px] shrink-0">
              <div className="h-full w-full overflow-hidden rounded-xl bg-muted">
                {thumbField ? (
                  <RenderCardCell
                    field={thumbField}
                    row={row}
                    tableSlug={slug}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                    sem imagem
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="space-y-1">
                <div className="text-base font-semibold truncate">
                  {titleField ? (
                    <RenderCardCell
                      field={titleField}
                      row={row}
                      tableSlug={slug}
                    />
                  ) : (
                    <span className="text-muted-foreground">Sem título</span>
                  )}
                </div>

                {descField ? (
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    <RenderCardCell
                      field={descField}
                      row={row}
                      tableSlug={slug}
                    />
                  </div>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
                {extraFields.map((field) => (
                  <div
                    key={field._id}
                    className="text-sm"
                  >
                    <div className="text-xs text-muted-foreground">
                      {field.name}
                    </div>
                    <div className="text-foreground">
                      <RenderCardCell
                        field={field}
                        row={row}
                        tableSlug={slug}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
