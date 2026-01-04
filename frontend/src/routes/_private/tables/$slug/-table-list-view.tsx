import { useParams, useRouter, useSearch } from '@tanstack/react-router';
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ChevronsLeftRightIcon,
  PlusIcon,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table as BaseTabela,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableListViewProps {
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

interface TableListViewHeaderProps {
  field: IField;
}

export function TableListViewHeader({
  field,
}: TableListViewHeaderProps): React.JSX.Element {
  const search = useSearch({
    from: '/_private/tables/$slug/',
  });

  const router = useRouter();

  const orderKey = 'order-'.concat(field.slug);

  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });

  return (
    <TableHead
      key={field._id}
      className="w-auto"
    >
      <div className="inline-flex items-center">
        <Button
          className="cursor-pointer h-auto px-2 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent"
          variant="link"
          onClick={() => {
            router.navigate({
              to: '/tables/$slug/field/$fieldId',
              params: {
                fieldId: field._id,
                slug,
              },
            });
          }}
        >
          {field.name}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={cn(
                'h-auto px-1 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent',
                field.type === FIELD_TYPE.FIELD_GROUP && 'invisible',
              )}
              variant="outline"
            >
              {search[orderKey] === 'asc' && <ArrowUpIcon className="size-4" />}
              {search[orderKey] === 'desc' && (
                <ArrowDownIcon className="size-4" />
              )}
              {!search[orderKey] && (
                <ChevronsLeftRightIcon className="size-4 rotate-90" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                router.navigate({
                  // @ts-ignore Tanstack Router Navigate
                  search: (state) => ({
                    ...state,
                    [orderKey]: 'asc',
                  }),
                });
              }}
            >
              <ArrowUpIcon />
              <span>Ascending</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                router.navigate({
                  // @ts-ignore Tanstack Router Navigate
                  search: (state) => ({
                    ...state,
                    [orderKey]: 'desc',
                  }),
                });
              }}
            >
              <ArrowDownIcon />
              <span>Descending</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TableHead>
  );
}

interface RenderCellProps {
  field: IField;
  row: IRow;
  tableSlug: string;
}

function RenderCell({
  field,
  row,
  tableSlug,
}: RenderCellProps): React.JSX.Element {
  if (!(field.slug in row)) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

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
          className="max-w-sm truncate"
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
}

export function TableListView({
  data,
  headers,
  order,
}: TableListViewProps): React.ReactElement {
  const router = useRouter();

  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });

  return (
    <BaseTabela>
      {headers.length > 0 && (
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            {headers
              .filter(HeaderFilter)
              .sort(HeaderSorter(order))
              .map((field) => (
                <TableListViewHeader
                  field={field}
                  key={field._id}
                />
              ))}

            <TableHead className="w-30">
              <Button
                variant="outline"
                className="cursor-pointer size-6"
                onClick={() => {
                  router.navigate({
                    to: '/tables/$slug/field/create',
                    replace: true,
                    params: {
                      slug,
                    },
                  });
                }}
              >
                <PlusIcon className="size-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={row._id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => {
              router.navigate({
                to: '/tables/$slug/row/$rowId',
                params: { slug, rowId: row._id },
              });
            }}
          >
            {headers
              .filter(HeaderFilter)
              .sort(HeaderSorter(order))
              .map((field) => (
                <TableCell key={field._id.concat('-').concat(row._id)}>
                  <RenderCell
                    field={field}
                    row={row}
                    tableSlug={slug}
                  />
                </TableCell>
              ))}
            <TableCell>
              <Button
                variant="ghost"
                size="icon-sm"
              >
                <ArrowRightIcon />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </BaseTabela>
  );
}
