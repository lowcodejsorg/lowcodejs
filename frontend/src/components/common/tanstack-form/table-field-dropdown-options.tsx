import { PlusIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import type { SortableChipItem } from '@/components/ui/combobox';
import { ComboboxSortableChips } from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { cn } from '@/lib/utils';

interface DropdownOption {
  value: string;
  label: string;
}

interface TableFieldDropdownOptionsProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function TableFieldDropdownOptions({
  label,
  placeholder = 'Adicionar opção...',
  disabled,
  required,
}: TableFieldDropdownOptionsProps): React.JSX.Element {
  const field = useFieldContext<Array<DropdownOption>>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [inputValue, setInputValue] = React.useState('');

  // Convert DropdownOption to SortableChipItem
  const sortableItems: Array<SortableChipItem> = React.useMemo(() => {
    return field.state.value.map((opt) => ({
      id: opt.value,
      label: opt.label,
    }));
  }, [field.state.value]);

  const handleAddOption = (): void => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    const exists = field.state.value.some(
      (opt) => opt.value.toLowerCase() === trimmedValue.toLowerCase(),
    );
    if (exists) return;

    const newOption: DropdownOption = {
      value: trimmedValue,
      label: trimmedValue,
    };

    field.handleChange([...field.state.value, newOption]);
    setInputValue('');
  };

  const handleRemoveOption = (optionId: string): void => {
    field.handleChange(
      field.state.value.filter((opt) => opt.value !== optionId),
    );
  };

  const handleReorder = (newItems: Array<SortableChipItem>): void => {
    const reorderedOptions = newItems.map((item) => ({
      value: item.id,
      label: item.label,
    }));
    field.handleChange(reorderedOptions);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOption();
    }
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <ComboboxSortableChips
        items={sortableItems}
        onReorder={handleReorder}
        onRemove={disabled ? undefined : handleRemoveOption}
        disabled={disabled}
        className={cn(isInvalid && 'border-destructive')}
      >
        <div className="flex flex-1 items-center gap-1">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="h-6 min-w-24 flex-1 border-none p-0 shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleAddOption}
            disabled={disabled || !inputValue.trim()}
          >
            <PlusIcon className="h-3 w-3" />
          </Button>
        </div>
      </ComboboxSortableChips>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
