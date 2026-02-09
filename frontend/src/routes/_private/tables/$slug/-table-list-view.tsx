import { useMutation } from '@tanstack/react-query';
import { useParams, useRouter, useSearch } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import {
  ArchiveRestoreIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ChevronsLeftRightIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { API } from '@/lib/api';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';
import { cn } from '@/lib/utils';

interface TableListViewProps {
  data: Array<IRow>;
  headers: Array<IField>;
  order: Array<string>;
}

function HeaderFilter(field: IField): boolean {
  return field.showInList && !field.trashed;
}

function HeaderSorter(order: Array<string>) {
  return function (a: IField, b: IField): number {
    return order.indexOf(a._id) - order.indexOf(b._id);
  };
}

interface TableListViewHeaderProps {
  field: IField;
  canEdit: boolean;
}

export function TableListViewHeader({
  field,
  canEdit,
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
      style={{ width: `${field.widthInList ?? 50}%` }}
    >
      <div className="inline-flex items-center">
        <Button
          className={cn(
            'h-auto px-2 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent',
            canEdit ? 'cursor-pointer' : 'cursor-default',
          )}
          variant="link"
          onClick={() => {
            if (!canEdit) return;
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
                field.type === E_FIELD_TYPE.FIELD_GROUP && 'invisible',
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
          className="max-w-sm truncate"
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

  const search = useSearch({
    from: '/_private/tables/$slug/',
  });

  const isTrashView = search.trashed === true;

  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

  const canCreateField = permission.can('CREATE_FIELD');
  const canEditField = permission.can('UPDATE_FIELD');
  const canTrashRow = permission.can('UPDATE_ROW');

  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(
    new Set(),
  );
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const visibleIds = data.map((row) => row._id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedRows.has(id));
  const someVisibleSelected =
    visibleIds.some((id) => selectedRows.has(id)) && !allVisibleSelected;
  const selectedCount = selectedRows.size;

  function toggleRow(id: string): void {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll(): void {
    if (allVisibleSelected) {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        for (const id of visibleIds) {
          next.delete(id);
        }
        return next;
      });
    } else {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        for (const id of visibleIds) {
          next.add(id);
        }
        return next;
      });
    }
  }

  function clearSelection(): void {
    setSelectedRows(new Set());
  }

  const bulkTrash = useMutation({
    mutationFn: async function (ids: Array<string>) {
      const route = '/tables/'.concat(slug).concat('/rows/bulk-trash');
      const response = await API.patch<{ modified: number }>(route, { ids });
      return response.data;
    },
    onSuccess(result) {
      setShowConfirmDialog(false);
      clearSelection();

      QueryClient.invalidateQueries({
        queryKey: ['/tables/'.concat(slug).concat('/rows/paginated')],
      });

      toast(
        result.modified === 1
          ? '1 registro enviado para lixeira!'
          : `${result.modified} registros enviados para lixeira!`,
        {
          className: '!bg-green-600 !text-white !border-green-600',
          description: 'Os registros foram movidos para a lixeira',
          descriptionClassName: '!text-white',
          closeButton: true,
        },
      );
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        toast.error(
          errorData?.message ?? 'Erro ao enviar registros para lixeira',
        );
      } else {
        toast.error('Erro ao enviar registros para lixeira');
      }
      console.error(error);
    },
  });

  const bulkRestore = useMutation({
    mutationFn: async function (ids: Array<string>) {
      const route = '/tables/'.concat(slug).concat('/rows/bulk-restore');
      const response = await API.patch<{ modified: number }>(route, { ids });
      return response.data;
    },
    onSuccess(result) {
      setShowConfirmDialog(false);
      clearSelection();

      QueryClient.invalidateQueries({
        queryKey: ['/tables/'.concat(slug).concat('/rows/paginated')],
      });

      toast(
        result.modified === 1
          ? '1 registro restaurado!'
          : `${result.modified} registros restaurados!`,
        {
          className: '!bg-green-600 !text-white !border-green-600',
          description: 'Os registros foram restaurados da lixeira',
          descriptionClassName: '!text-white',
          closeButton: true,
        },
      );
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        toast.error(errorData?.message ?? 'Erro ao restaurar registros');
      } else {
        toast.error('Erro ao restaurar registros');
      }
      console.error(error);
    },
  });

  return (
    <>
      <BaseTabela>
        {headers.length > 0 && (
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              {canTrashRow && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      allVisibleSelected
                        ? true
                        : someVisibleSelected
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={toggleAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
              )}

              {headers
                .filter(HeaderFilter)
                .sort(HeaderSorter(order))
                .map((field) => (
                  <TableListViewHeader
                    field={field}
                    key={field._id}
                    canEdit={canEditField}
                  />
                ))}

              {canCreateField && (
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
              )}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row._id}
              className="cursor-pointer hover:bg-muted/50"
              data-state={selectedRows.has(row._id) ? 'selected' : undefined}
              onClick={() => {
                router.navigate({
                  to: '/tables/$slug/row/$rowId',
                  params: { slug, rowId: row._id },
                });
              }}
            >
              {canTrashRow && (
                <TableCell className="w-10">
                  <Checkbox
                    checked={selectedRows.has(row._id)}
                    onCheckedChange={() => toggleRow(row._id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Selecionar registro ${row._id}`}
                  />
                </TableCell>
              )}

              {headers
                .filter(HeaderFilter)
                .sort(HeaderSorter(order))
                .map((field) => (
                  <TableCell
                    key={field._id.concat('-').concat(row._id)}
                    style={{ width: `${field.widthInList ?? 50}%` }}
                  >
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

      {selectedCount > 0 && (
        <div className="sticky bottom-4 mx-auto flex w-fit items-center gap-3 rounded-lg border bg-background px-4 py-2 shadow-lg">
          <span className="text-sm font-medium">
            {selectedCount === 1
              ? '1 registro selecionado'
              : `${selectedCount} registros selecionados`}
          </span>
          {isTrashView ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmDialog(true)}
            >
              <ArchiveRestoreIcon className="size-4" />
              <span>Restaurar</span>
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowConfirmDialog(true)}
            >
              <Trash2Icon className="size-4" />
              <span>Enviar para lixeira</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearSelection}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      )}

      <Dialog
        modal
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
      >
        <DialogContent className="py-4 px-6">
          <DialogHeader>
            <DialogTitle>
              {isTrashView
                ? 'Restaurar registros da lixeira'
                : 'Enviar registros para a lixeira'}
            </DialogTitle>
            <DialogDescription>
              {isTrashView
                ? selectedCount === 1
                  ? 'Ao confirmar essa ação, 1 registro será restaurado da lixeira.'
                  : `Ao confirmar essa ação, ${selectedCount} registros serão restaurados da lixeira.`
                : selectedCount === 1
                  ? 'Ao confirmar essa ação, 1 registro será enviado para a lixeira.'
                  : `Ao confirmar essa ação, ${selectedCount} registros serão enviados para a lixeira.`}
            </DialogDescription>
          </DialogHeader>
          <section>
            <form className="pt-4 pb-2">
              <DialogFooter className="inline-flex w-full gap-2 justify-end">
                <DialogClose asChild>
                  <Button className="bg-destructive hover:bg-destructive">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  disabled={
                    isTrashView
                      ? bulkRestore.status === 'pending'
                      : bulkTrash.status === 'pending'
                  }
                  onClick={() => {
                    if (isTrashView) {
                      bulkRestore.mutateAsync(Array.from(selectedRows));
                    } else {
                      bulkTrash.mutateAsync(Array.from(selectedRows));
                    }
                  }}
                >
                  {(isTrashView
                    ? bulkRestore.status === 'pending'
                    : bulkTrash.status === 'pending') && (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  )}
                  {!(isTrashView
                    ? bulkRestore.status === 'pending'
                    : bulkTrash.status === 'pending') && <span>Confirmar</span>}
                </Button>
              </DialogFooter>
            </form>
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
}
