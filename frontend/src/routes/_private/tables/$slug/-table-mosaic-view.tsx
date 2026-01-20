import { useParams, useRouter } from '@tanstack/react-router';
import React from 'react';

import { TableRowCategoryCell } from '@/components/common/table-row-category-cell';
import { TableRowDateCell } from '@/components/common/table-row-date-cell';
import { TableRowDropdownCell } from '@/components/common/table-row-dropdown-cell';
import { TableRowEvaluationCell } from '@/components/common/table-row-evaluation-cell';
import { TableRowFieldGroupCell } from '@/components/common/table-row-field-group-cell';
import { TableRowFileCell } from '@/components/common/table-row-file-cell';
import { TableRowReactionCell } from '@/components/common/table-row-reaction-cell';
import { TableRowRelationshipCell } from '@/components/common/table-row-relationship-cell';
import { TableRowTextLongCell } from '@/components/common/table-row-text-long-cell';
import { TableRowTextShortCell } from '@/components/common/table-row-text-short-cell';
import { TableRowUserCell } from '@/components/common/table-row-user-cell';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow } from '@/lib/interfaces';
import { HeaderFilter, HeaderSorter } from '@/lib/layout-pickers';

interface Props {
  data: Array<IRow>;
  headers: Array<IField>;
  order: Array<string>;
}

interface RenderMosaicCellProps {
  field: IField;
  row: IRow;
  tableSlug: string;
}

function RenderMosaicCell({
  field,
  row,
  tableSlug,
}: RenderMosaicCellProps): React.JSX.Element {
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
      case E_FIELD_TYPE.USER:
        return (
          <TableRowUserCell
            field={field}
            row={row}
          />
        );
      default:
        return <span className="text-muted-foreground text-sm">-</span>;
    }
  };

  return <div className="flex flex-col gap-0.5">{renderContent()}</div>;
}

export function TableMosaicView({
  data,
  headers,
  order,
}: Props): React.JSX.Element {
  const router = useRouter();
  const { slug } = useParams({ from: '/_private/tables/$slug/' });

  const visibleHeaders = headers.filter(HeaderFilter).sort(HeaderSorter(order));

  const thumbField = visibleHeaders.find((f) => f.type === E_FIELD_TYPE.FILE);
  const titleField = visibleHeaders.find(
    (f) => f.type === E_FIELD_TYPE.TEXT_SHORT,
  );
  const descField = visibleHeaders.find(
    (f) => f.type === E_FIELD_TYPE.TEXT_LONG,
  );

  const used = new Set(
    [thumbField?._id, titleField?._id, descField?._id].filter(
      Boolean,
    ) as Array<string>,
  );
  const rest = visibleHeaders.filter(
    (f) => !used.has(f._id) && f.type !== E_FIELD_TYPE.FILE,
  );

  return (
    <div className="gap-x-4 columns-1 sm:columns-2 lg:columns-3 xl:columns-4">
      {data.map((row) => (
        <article
          key={row._id}
          className="mb-4 break-inside-avoid rounded-2xl border border-border/60 bg-background shadow-sm overflow-hidden cursor-pointer hover:bg-muted/20"
          onClick={() => {
            router.navigate({
              to: '/tables/$slug/row/$rowId',
              params: { slug, rowId: row._id },
            });
          }}
        >
          <div className="w-full bg-muted">
            {thumbField ? (
              <RenderMosaicCell
                field={thumbField}
                row={row}
                tableSlug={slug}
              />
            ) : (
              <div className="w-full aspect-4/3 flex items-center justify-center text-xs text-muted-foreground">
                sem imagem
              </div>
            )}
          </div>

          <div className="p-3">
            <div className="font-semibold leading-tight line-clamp-2">
              {titleField ? (
                <RenderMosaicCell
                  field={titleField}
                  row={row}
                  tableSlug={slug}
                />
              ) : (
                <span className="text-muted-foreground">Sem título</span>
              )}
            </div>

            {descField ? (
              <div className="mt-1 text-sm text-muted-foreground line-clamp-3">
                <RenderMosaicCell
                  field={descField}
                  row={row}
                  tableSlug={slug}
                />
              </div>
            ) : null}

            <div className="mt-2 space-y-1">
              {rest.map((field) => (
                <div
                  key={field._id}
                  className="text-xs"
                >
                  <span className="text-muted-foreground">{field.name}: </span>
                  <span className="text-foreground">
                    <RenderMosaicCell
                      field={field}
                      row={row}
                      tableSlug={slug}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
