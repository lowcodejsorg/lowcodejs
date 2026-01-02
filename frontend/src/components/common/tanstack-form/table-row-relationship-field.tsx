import {
  CheckIcon,
  ChevronsUpDownIcon,
  LoaderIcon,
} from 'lucide-react';
import React from 'react';

import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useRelationshipRowsReadPaginated } from '@/hooks/tanstack-query/use-relationship-rows-read-paginated';
import type { IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableRowRelationshipFieldProps {
  field: IField;
  disabled?: boolean;
}

type SearchableOption = {
  value: string;
  label: string;
};

export function TableRowRelationshipField({
  field,
  disabled,
}: TableRowRelationshipFieldProps): React.JSX.Element {
  const formField = useFieldContext<Array<SearchableOption>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');

  const relConfig = field.configuration.relationship;
  const isMultiple = field.configuration.multiple;
  const selectedValues = formField.state.value ?? [];

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useRelationshipRowsReadPaginated({
    tableSlug: relConfig?.table.slug ?? '',
    fieldSlug: field.slug,
    search: debouncedQuery,
    page: 1,
    perPage: 50,
    enabled: Boolean(relConfig) && open,
  });

  if (!relConfig) {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <p className="text-muted-foreground text-sm">
          Relacionamento não configurado
        </p>
      </Field>
    );
  }

  const allItems =
    data?.data.map((row) => ({
      value: row._id,
      label: String(row[relConfig.field.slug] ?? row._id),
    })) ?? [];

  const handleSelect = (item: SearchableOption): void => {
    if (isMultiple) {
      const isSelected = selectedValues.some((v) => v.value === item.value);
      if (isSelected) {
        formField.handleChange(
          selectedValues.filter((v) => v.value !== item.value),
        );
      } else {
        formField.handleChange([...selectedValues, item]);
      }
    } else {
      formField.handleChange([item]);
      setOpen(false);
    }
  };

  const displayValue = (): React.ReactNode => {
    if (selectedValues.length === 0) {
      return (
        <span className="text-muted-foreground">
          Selecione {field.name.toLowerCase()}
        </span>
      );
    }
    if (isMultiple) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedValues.slice(0, 2).map((v) => (
            <Badge key={v.value} variant="secondary" className="text-xs">
              {v.label}
            </Badge>
          ))}
          {selectedValues.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{selectedValues.length - 2}
            </Badge>
          )}
        </div>
      );
    }
    return selectedValues[0]?.label;
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between h-auto min-h-9 py-2"
          >
            {displayValue()}
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-60 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Buscar ${field.name.toLowerCase()}...`}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Carregando...' : 'Nenhum resultado encontrado'}
              </CommandEmpty>
              <CommandGroup>
                {allItems.map((item) => {
                  const isSelected = selectedValues.some(
                    (v) => v.value === item.value,
                  );
                  return (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => handleSelect(item)}
                    >
                      {isMultiple ? (
                        <Checkbox checked={isSelected} className="mr-2" />
                      ) : (
                        <CheckIcon
                          className={cn(
                            'mr-2 size-4',
                            isSelected ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      )}
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {isLoading && (
                <div className="flex justify-center p-2">
                  <LoaderIcon className="size-4 animate-spin opacity-50" />
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
