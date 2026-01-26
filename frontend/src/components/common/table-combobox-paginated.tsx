import { useInfiniteQuery } from '@tanstack/react-query';
import * as React from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { API } from '@/lib/api';
import type { ITable, Paginated } from '@/lib/interfaces';

interface TableComboboxPaginatedProps {
  value?: string;
  onValueChange?: (value: string, slug?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TableComboboxPaginated({
  value = '',
  onValueChange,
  placeholder = 'Selecione uma tabela...',
  className,
  disabled = false,
}: TableComboboxPaginatedProps): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ['/tables/paginated', { search: debouncedSearch }],
      queryFn: async ({ pageParam }) => {
        const response = await API.get<Paginated<ITable>>('/tables/paginated', {
          params: {
            page: pageParam,
            perPage: 10,
            search: debouncedSearch || undefined,
          },
        });
        return response.data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.meta.page < lastPage.meta.lastPage
          ? lastPage.meta.page + 1
          : undefined,
    });

  const tables = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data?.pages],
  );

  const selectedTable = React.useMemo(
    () => tables.find((t) => t._id === value) ?? null,
    [tables, value],
  );

  return (
    <Combobox
      items={tables}
      value={selectedTable}
      onValueChange={(table: ITable | null) => {
        onValueChange?.(table?._id ?? '', table?.slug);
      }}
      onInputValueChange={setSearch}
      itemToStringLabel={(table: ITable) => table.name}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={selectedTable?.name || placeholder}
        showClear={!!selectedTable}
        className={className}
      />
      <ComboboxContent>
        <ComboboxEmpty>Nenhuma tabela encontrada.</ComboboxEmpty>

        {status === 'pending' && (
          <div className="text-muted-foreground flex items-center justify-center gap-2 p-3 text-sm">
            <Spinner className="size-4" />
            Carregando...
          </div>
        )}

        {status === 'success' && (
          <>
            <ComboboxList>
              {(table: ITable): React.ReactNode => (
                <ComboboxItem key={table._id} value={table}>
                  <div className="flex flex-col">
                    <span className="font-medium">{table.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {table.slug}
                    </span>
                  </div>
                </ComboboxItem>
              )}
            </ComboboxList>

            {hasNextPage && (
              <div className="border-t p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Spinner className="size-4" />
                      Carregando...
                    </>
                  ) : (
                    'Carregar mais'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
