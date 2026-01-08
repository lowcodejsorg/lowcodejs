import * as React from 'react';

import { Combobox } from '@/components/ui/combobox';
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

  return (
    <Combobox
      value={value ? [value] : []}
      onChange={(ids, items) => onValueChange?.(ids[0] ?? '', items[0]?.slug)}
      items={tables}
      loading={status === 'pending'}
      getItemId={(table) => table._id}
      getItemLabel={(table) => table.name}
      renderItem={(table: ITable) => (
        <div className="flex flex-col">
          <span className="font-medium">{table.name}</span>
          <span className="text-xs text-muted-foreground">{table.slug}</span>
        </div>
      )}
      placeholder={placeholder}
      emptyMessage="Nenhuma tabela encontrada."
      className={className}
      disabled={disabled}
    />
  );
}
