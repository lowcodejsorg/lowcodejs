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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTablesPaginated } from '@/integrations/tanstack-query/implementations/use-tables-paginated';
import { cn } from '@/lib/utils';

import { useFieldContext } from '../form-context';

interface RelationshipTableSelectFieldProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  excludeTableSlug?: string;
  onTableChange?: (tableSlug: string) => void;
}

export function RelationshipTableSelectField({
  label,
  placeholder = 'Selecione uma tabela',
  disabled,
  required,
  excludeTableSlug,
  onTableChange,
}: RelationshipTableSelectFieldProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const { data, status } = useTablesPaginated();
  const tables =
    data?.data.filter((t) => !excludeTableSlug || t.slug !== excludeTableSlug) ??
    [];

  const selectedTable = tables.find((t) => t._id === field.state.value);
  const isDisabled = disabled || status === 'pending';

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              isInvalid && 'border-destructive',
            )}
            disabled={isDisabled}
          >
            {selectedTable ? selectedTable.name : placeholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar tabela..." className="h-9" />
            <CommandList>
              <CommandEmpty>Nenhuma tabela encontrada.</CommandEmpty>
              <CommandGroup>
                {tables.map((table) => (
                  <CommandItem
                    key={table._id}
                    value={table.name}
                    onSelect={() => {
                      field.handleChange(table._id);
                      onTableChange?.(table.slug);
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
                        field.state.value === table._id
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
