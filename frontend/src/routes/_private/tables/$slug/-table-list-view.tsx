import { useParams, useRouter, useSearch } from '@tanstack/react-router';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsLeftRightIcon,
  PlusIcon,
} from 'lucide-react';
import React from 'react';

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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { IField, IRow } from '@/lib/interfaces';

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

  const orderKey = 'order-'.concat(field._id);

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
              className="h-auto px-1 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent"
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
      {/* <FieldTableUpdateSheet
        _id={field._id}
        ref={updateTableFieldButtonRef}
      /> */}
    </TableHead>
  );
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
        {data.map((row) => {
          return (
            <TableRow key={row._id}>
              {/* {headers
                ?.sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id))
                ?.filter((f) => f?.configuration?.listing && !f?.trashed)
                ?.map((field) => (
                  <ListRowCell
                    field={field}
                    row={row}
                    key={field._id?.concat('-').concat(field._id)}
                  />
                ))} */}

              {/* {!isPublicPage && (
                <TableCell className="w-20">
                  <ActionMenu row={row} />
                </TableCell>
              )} */}
            </TableRow>
          );
        })}
      </TableBody>

      {/* <FieldTableCreateSheet ref={createTableFieldButtonRef} /> */}
    </BaseTabela>
  );
}
