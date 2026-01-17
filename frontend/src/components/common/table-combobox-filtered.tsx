import * as React from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface TableComboboxFilteredSafeProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;

  /** opções já filtradas */
  options: SelectOption[];
}

export function TableComboboxFilteredSafe({
  value = '',
  onValueChange,
  placeholder = 'Selecione uma tabela...',
  className,
  disabled = false,
  options,
}: TableComboboxFilteredSafeProps): React.JSX.Element {
  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.value === value) ?? null;
  }, [options, value]);

  return (
    <Combobox
      items={options}
      value={selectedOption}
      onValueChange={(opt: SelectOption | null) => {
        onValueChange?.(opt?.value ?? '');
      }}
      itemToStringLabel={(opt: SelectOption) => opt.label}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={selectedOption?.label || placeholder}
        showClear={!!selectedOption}
        className={className}
      />

      <ComboboxContent>
        <ComboboxEmpty>Nenhuma tabela encontrada.</ComboboxEmpty>

        <ComboboxList>
          {(opt: SelectOption): React.ReactNode => (
            <ComboboxItem
              key={opt.value}
              value={opt}
            >
              <div className="flex flex-col">
                <span className="font-medium">{opt.label}</span>

                {opt.subLabel && (
                  <span className="text-muted-foreground text-xs">
                    {opt.subLabel}
                  </span>
                )}
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
