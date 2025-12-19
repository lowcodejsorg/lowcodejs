import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { API } from '@/lib/api';
import { Paginated } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface ITable {
  _id: string;
  name: string;
  slug: string;
}

interface TableComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TableCombobox({
  value = '',
  onValueChange,
  placeholder = 'Selecione uma tabela...',
  className,
  disabled = false,
}: TableComboboxProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const { data: tables, status } = useQuery({
    queryKey: ['/tables/paginated'],
    queryFn: async function () {
      const route = '/tables/paginated';
      const response = await API.get<Paginated<ITable>>(route, {
        params: {
          page: 1,
          perPage: 50,
        },
      });
      return response.data.data;
    },
  });

  const selectedTable = tables?.find((table) => table._id === value);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled || status === 'pending'}
        >
          {selectedTable && `${selectedTable.name}`}
          {!selectedTable && placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Buscar tabela..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>Nenhuma tabela encontrada.</CommandEmpty>
            <CommandGroup>
              {tables?.map((table) => (
                <CommandItem
                  key={table._id}
                  value={`${table.name}`}
                  onSelect={() => {
                    if (!(table._id === value)) {
                      onValueChange?.(table._id);
                    }

                    if (table._id === value) {
                      onValueChange?.('');
                    }

                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{table.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {table.slug}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto',
                      value === table._id && 'opacity-100',
                      !(value === table._id) && 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
