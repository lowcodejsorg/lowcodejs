import * as React from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Spinner } from '@/components/ui/spinner';
import { useTablesReadPaginated } from '@/hooks/tanstack-query/use-tables-read-paginated';
import type { ITable } from '@/lib/interfaces';

interface TableMultiSelectProps {
  value?: Array<string>;
  onValueChange?: (value: Array<string>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowedTableIds?: Array<string>;
}

export function TableMultiSelect({
  value = [],
  onValueChange,
  placeholder = 'Selecione tabelas...',
  className,
  disabled = false,
  allowedTableIds,
}: TableMultiSelectProps): React.JSX.Element {
  const anchorRef = useComboboxAnchor();
  const { data: tables, status } = useTablesReadPaginated(
    allowedTableIds?.length ? { _ids: allowedTableIds } : undefined,
  );

  const items: Array<ITable> = tables?.data ?? [];

  const selectedTables = React.useMemo<Array<ITable>>(() => {
    return items.filter((table) => value.includes(table._id));
  }, [items, value]);

  return (
    <Combobox
      items={items}
      multiple
      value={selectedTables}
      onValueChange={(newTables: Array<ITable>) => {
        onValueChange?.(newTables.map((p) => p._id));
      }}
      itemToStringLabel={(table: ITable) => table.name}
      disabled={disabled}
    >
      <ComboboxChips
        ref={anchorRef}
        className={className}
      >
        <ComboboxValue>
          {(selectedValue: Array<ITable>): React.ReactNode => (
            <React.Fragment>
              {selectedValue.map((table) => (
                <ComboboxChip
                  key={table._id}
                  aria-label={table.name}
                >
                  {table.name}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={selectedValue.length > 0 ? '' : placeholder}
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>Nenhuma tabela encontrada.</ComboboxEmpty>
        <ComboboxList>
          {status === 'pending' ? (
            <div className="flex items-center justify-center p-3">
              <Spinner className="opacity-50" />
            </div>
          ) : (
            (table: ITable): React.ReactNode => (
              <ComboboxItem
                key={table._id}
                value={table}
              >
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{table.name}</span>
                  {table.description && (
                    <span className="text-muted-foreground text-sm">
                      {table.description}
                    </span>
                  )}
                </div>
              </ComboboxItem>
            )
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
