import {
  LayoutDashboardIcon,
  LayoutListIcon,
  LoaderCircleIcon,
  ListTreeIcon
} from 'lucide-react';
import { toast } from 'sonner';

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
import type { ITable, Paginated } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';
import { cn } from '@/lib/utils';

import { FIELD_TYPE } from '@/lib/constant';



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

  const canShowDocument =
    table.status === 'success' &&
    table.data?.fields?.some(
      (f) => !f.trashed && f.type === FIELD_TYPE.TEXT_SHORT
    ) &&
    table.data?.fields?.some(
      (f) => !f.trashed && f.type === FIELD_TYPE.TEXT_LONG
    );

  const handleStyleChange = (style: 'list' | 'gallery' | 'document') => {
    if (!table.data) return;

    update.mutate({
      ...table.data,
      slug,
      fields: table.data.fields.map((f) => f._id),
      configuration: {
        ...table.data.configuration,
        style,
        administrators:
          table.data.configuration.administrators?.map((a) => a._id) ?? [],
        owner: table.data.configuration.owner?._id ?? '',
      },
      logo: table.data.logo?._id ?? null,
    } as any);
  };

  const currentStyle = table.data?.configuration?.style ?? 'list';
  const isDisabled =
    (table.status === 'success' && table.data?.fields?.length === 0) ||
    table.status === 'pending' ||
    update.status === 'pending';

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
          {update.status === 'pending' ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : currentStyle === 'gallery' ? (
            <LayoutDashboardIcon className="size-4" />
          ) : (
            <LayoutListIcon className="size-4" />
          )}
          <span>Exibicao</span>
        </Button>
      </DropdownMenuTrigger>

      {table.status === 'success' && (
        <DropdownMenuContent className="max-w-xs">
          <DropdownMenuRadioGroup value={currentStyle}>
            <DropdownMenuRadioItem
              value="list"
              className="inline-flex space-x-1 w-full"
              onClick={() => handleStyleChange('list')}
            >
              <LayoutListIcon className="size-4" />
              <span>Lista</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              className="inline-flex space-x-1 w-full"
              value="gallery"
              onClick={() => handleStyleChange('gallery')}
            >
              <LayoutDashboardIcon className="size-4" />
              <span>Galeria</span>
            </DropdownMenuRadioItem>
            
            {canShowDocument && ( 
              <DropdownMenuRadioItem
                className="inline-flex space-x-1 w-full"
                value="document"
                onClick={() => handleStyleChange('document')}
              >
                <ListTreeIcon className="size-4" />
                <span>Documento</span>
              </DropdownMenuRadioItem>
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
