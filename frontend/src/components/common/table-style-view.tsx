import {
  LayoutDashboardIcon,
  LayoutListIcon,
  ListTreeIcon,
  LayoutDashboard,
  LayoutPanelLeft,
} from 'lucide-react';
import { toast } from 'sonner';

import { Spinner } from '../ui/spinner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useUpdateTable } from '@/hooks/tanstack-query/use-table-update';
import { useTablePermission } from '@/hooks/use-table-permission';
import { E_FIELD_TYPE, E_TABLE_STYLE } from '@/lib/constant';
import type { ITable, Paginated, ValueOf } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';
import { cn } from '@/lib/utils';

interface TableStyleViewDropdownProps {
  slug: string;
}

export function TableStyleViewDropdown({
  slug,
}: TableStyleViewDropdownProps): React.JSX.Element | null {
  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

  // Hook deve ser chamado antes de qualquer return condicional
  const update = useUpdateTable({
    onSuccess(data) {
      QueryClient.setQueryData<ITable>(
        ['/tables/'.concat(data.slug), data.slug],
        data,
      );

      QueryClient.setQueryData<Paginated<ITable>>(
        ['/tables/paginated'],
        (old) => {
          if (!old) return old;

          return {
            meta: old.meta,
            data: old.data.map((item) => {
              if (item._id === data._id) {
                return data;
              }
              return item;
            }),
          };
        },
      );
    },
    onError(error) {
      console.error(error);
      toast.error('Erro ao atualizar estilo da tabela');
    },
  });

  // Ocultar se não pode editar tabela
  if (!permission.can('UPDATE_TABLE')) return null;

  const handleStyleChange = (style: ValueOf<typeof E_TABLE_STYLE>): void => {
    if (!table.data) return;

    update.mutate({
      ...table.data,
      slug,
      fields: table.data.fields.map((f) => f._id),
      configuration: {
        ...table.data.configuration,
        style,
        administrators: table.data.configuration.administrators.flatMap(
          (a) => a._id,
        ),
      },
      logo: table.data.logo?._id ?? null,
    } as any);
  };

  const currentStyle = table.data?.configuration.style ?? E_TABLE_STYLE.LIST;

  const isDisabled =
    (table.status === 'success' && table.data.fields.length === 0) ||
    table.status === 'pending' ||
    update.status === 'pending';

  const existFieldCategory =
    table.status === 'success' &&
    table.data.fields.some(
      (f) => !f.trashed && f.type === E_FIELD_TYPE.CATEGORY,
    );

  const existFieldTextShort =
    table.status === 'success' &&
    table.data.fields.some(
      (f) => !f.trashed && f.type === E_FIELD_TYPE.TEXT_SHORT,
    );

  const existFieldTextLong =
    table.status === 'success' &&
    table.data.fields.some(
      (f) => !f.trashed && f.type === E_FIELD_TYPE.TEXT_LONG,
    );

  const existFieldFile =
    table.status === 'success' &&
    table.data.fields.some(
      (f) => !f.trashed && f.type === E_FIELD_TYPE.FILE,
    );

  const canShowDocument =
    table.status === 'success' && existFieldCategory && existFieldTextLong;
  
  const canShowCard = existFieldFile && existFieldTextLong && existFieldTextShort;
  const canShowMosaic = existFieldFile && existFieldTextLong && existFieldTextShort;

  return (
    <DropdownMenu
      dir="ltr"
      modal={false}
    >
      <DropdownMenuTrigger
        asChild
        disabled={isDisabled}
      >
        <Button
          className={cn('shadow-none p-1 h-auto')}
          variant="outline"
        >
          {update.status === 'pending' && <Spinner />}

          {table.status === 'success' &&
            currentStyle === E_TABLE_STYLE.GALLERY && (
              <LayoutDashboardIcon className="size-4" />
            )}

          {table.status === 'success' &&
            currentStyle === E_TABLE_STYLE.LIST && (
              <LayoutListIcon className="size-4" />
            )}

          {table.status === 'success' &&
            currentStyle === E_TABLE_STYLE.DOCUMENT && (
              <ListTreeIcon className="size-4" />
            )}

          <span>Exibição</span>
        </Button>
      </DropdownMenuTrigger>

      {table.status === 'success' && (
        <DropdownMenuContent className="max-w-xs">
          <DropdownMenuRadioGroup value={currentStyle}>
            <DropdownMenuRadioItem
              value={E_TABLE_STYLE.LIST}
              className="inline-flex space-x-1 w-full"
              onClick={() => handleStyleChange(E_TABLE_STYLE.LIST)}
            >
              <LayoutListIcon className="size-4" />
              <span>Lista</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              className="inline-flex space-x-1 w-full"
              value={E_TABLE_STYLE.GALLERY}
              onClick={() => handleStyleChange(E_TABLE_STYLE.GALLERY)}
            >
              <LayoutDashboardIcon className="size-4" />
              <span>Galeria</span>
            </DropdownMenuRadioItem>

            {canShowDocument && (
              <DropdownMenuRadioItem
                className="inline-flex space-x-1 w-full"
                value="document"
                onClick={() => handleStyleChange(E_TABLE_STYLE.DOCUMENT)}
              >
                <ListTreeIcon className="size-4" />
                <span>Documento</span>
              </DropdownMenuRadioItem>
            )}

            {canShowCard && (
              <DropdownMenuRadioItem
                className="inline-flex space-x-1 w-full"
                value="card"
                onClick={() => handleStyleChange(E_TABLE_STYLE.CARD)}
              >
                <LayoutPanelLeft className="size-4" />
                <span>Card</span>

                </DropdownMenuRadioItem>
            )}

            {canShowMosaic && (
              <DropdownMenuRadioItem
                className="inline-flex space-x-1 w-full"
                value="mosaic"
                onClick={() => handleStyleChange(E_TABLE_STYLE.MOSAIC)}
              >
                <LayoutDashboard className="size-4" />
                <span>Mosaico</span>
              </DropdownMenuRadioItem>
            )}

          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
