import * as React from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { useTablesReadPaginated } from '@/hooks/tanstack-query/use-tables-read-paginated';
import type { ITable } from '@/lib/interfaces';

interface TableComboboxProps {
  value?: string;
  onValueChange?: (value: string, slug?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeSlug?: string;
}

export function TableCombobox({
  value = '',
  onValueChange,
  placeholder = 'Selecione uma tabela...',
  className,
  disabled = false,
  excludeSlug,
}: TableComboboxProps): React.JSX.Element {
  const { data, status } = useTablesReadPaginated();

  const tables = React.useMemo(() => {
    const allTables = data?.data ?? [];
    if (!excludeSlug) return allTables;
    return allTables.filter((t) => t.slug !== excludeSlug);
  }, [data?.data, excludeSlug]);

  // Find selected table
  const selectedTable = React.useMemo(() => {
    return tables.find((t) => t._id === value) ?? null;
  }, [tables, value]);

  return (
    <Combobox
      items={tables}
      value={selectedTable}
      onValueChange={(table: ITable | null) => {
        onValueChange?.(table?._id ?? '', table?.slug);
      }}
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
          <div className="text-muted-foreground p-3 text-center text-sm">
            Carregando...
          </div>
        )}
        {status === 'success' && (
          <ComboboxList>
            {(table: ITable): React.ReactNode => (
              <ComboboxItem
                key={table._id}
                value={table}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{table.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {table.slug}
                  </span>
                </div>
              </ComboboxItem>
            )}
          </ComboboxList>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
