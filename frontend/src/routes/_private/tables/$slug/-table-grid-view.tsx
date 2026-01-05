import { useParams, useRouter } from '@tanstack/react-router';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import React from 'react';

import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow } from '@/lib/interfaces';

interface TableGridViewProps {
  data: Array<IRow>;
  headers: Array<IField>;
  order: Array<string>;
}

function HeaderFilter(field: IField): boolean {
  return field.configuration.listing && !field.trashed;
}

function HeaderSorter(order: Array<string>) {
  return function (a: IField, b: IField): number {
    return order.indexOf(a._id) - order.indexOf(b._id);
  };
}

interface RenderGridCellProps {
  field: IField;
  row: IRow;
  tableSlug: string;
}

function RenderGridCell({
  field,
  row,
  tableSlug,
}: RenderGridCellProps): React.JSX.Element {
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
      case FIELD_TYPE.TEXT_SHORT:
        return (
          <TableRowTextShortCell
            field={field}
            row={row}
          />
        );
      case FIELD_TYPE.TEXT_LONG:
        return (
          <TableRowTextLongCell
            field={field}
            row={row}
          />
        );
      case FIELD_TYPE.DATE:
        return (
          <TableRowDateCell
            field={field}
            row={row}
          />
        );
      case FIELD_TYPE.DROPDOWN:
        return (
          <TableRowDropdownCell
            field={field}
            row={row}
          />
        );
      case FIELD_TYPE.CATEGORY:
        return (
          <TableRowCategoryCell
            field={field}
            row={row}
          />
        );
      case FIELD_TYPE.RELATIONSHIP:
        return (
          <TableRowRelationshipCell
            field={field}
            row={row}
          />
        );
      case FIELD_TYPE.FILE:
        return (
          <TableRowFileCell
            field={field}
            row={row}
            isGallery
          />
        );
      case FIELD_TYPE.FIELD_GROUP:
        return (
          <TableRowFieldGroupCell
            field={field}
            row={row}
            tableSlug={tableSlug}
          />
        );
      case FIELD_TYPE.REACTION:
        return (
          <TableRowReactionCell
            field={field}
            row={row}
            tableSlug={tableSlug}
          />
        );
      case FIELD_TYPE.EVALUATION:
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

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">
        {field.name}
      </span>
      {renderContent()}
    </div>
  );
}

export function TableGridView({
  data,
  headers,
  order,
}: TableGridViewProps): React.ReactElement {
  const router = useRouter();

  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });

  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

  const canCreateRow = permission.can('CREATE_ROW');

  const filteredHeaders = headers
    .filter(HeaderFilter)
    .sort(HeaderSorter(order));

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((row) => (
          <Card
            key={row._id}
            className="overflow-hidden p-0"
          >
            <CardContent className="p-3 space-y-3">
              {filteredHeaders.map((field) => (
                <RenderGridCell
                  key={field._id}
                  field={field}
                  row={row}
                  tableSlug={slug}
                />
              ))}
            </CardContent>
            <CardFooter className="inline-flex justify-end p-1">
              <Button
                variant="ghost"
                className="p-0"
                onClick={() => {
                  router.navigate({
                    to: '/tables/$slug/row/$rowId',
                    params: { slug, rowId: row._id },
                  });
                }}
              >
                <span>Ver detalhes</span>
                <ArrowRightIcon />
              </Button>
            </CardFooter>
          </Card>
        ))}

        {canCreateRow && (
          <Card className="overflow-hidden border-dashed flex items-center justify-center min-h-32">
            <Button
              variant="ghost"
              className="flex flex-col gap-2 h-full w-full"
              onClick={() => {
                router.navigate({
                  to: '/tables/$slug/row/create',
                  replace: true,
                  params: { slug },
                });
              }}
            >
              <PlusIcon className="size-8 text-muted-foreground" />
              <span className="text-muted-foreground">Novo registro</span>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
