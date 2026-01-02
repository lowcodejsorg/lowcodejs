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
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { cn } from '@/lib/utils';

interface FieldComboboxProps {
  value?: string;
  onValueChange?: (value: string, slug?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  tableSlug: string;
}

export function FieldCombobox({
  value = '',
  onValueChange,
  placeholder = 'Selecione um campo...',
  className,
  disabled = false,
  tableSlug,
}: FieldComboboxProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const { data, status } = useReadTable({ slug: tableSlug });
  const fields = data?.fields ?? [];

  const selectedField = fields.find((field) => field._id === value);

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
          {selectedField && `${selectedField.name}`}
          {!selectedField && placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Buscar campo..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>Nenhum campo encontrado.</CommandEmpty>
            <CommandGroup>
              {fields.map((field) => (
                <CommandItem
                  key={field._id}
                  value={`${field.name}`}
                  onSelect={() => {
                    if (!(field._id === value)) {
                      onValueChange?.(field._id, field.slug);
                    }

                    if (field._id === value) {
                      onValueChange?.('', undefined);
                    }

                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{field.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {field.slug}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto',
                      value === field._id && 'opacity-100',
                      !(value === field._id) && 'opacity-0',
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
