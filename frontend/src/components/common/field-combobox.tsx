import * as React from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Spinner } from '@/components/ui/spinner';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import type { IField } from '@/lib/interfaces';

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
  const { data, status } = useReadTable({ slug: tableSlug });
  const fields = data?.fields ?? [];

  // Find selected field
  const selectedField = React.useMemo(() => {
    return fields.find((f) => f._id === value) ?? null;
  }, [fields, value]);

  return (
    <Combobox
      items={fields}
      value={selectedField}
      onValueChange={(field: IField | null) => {
        onValueChange?.(field?._id ?? '', field?.slug);
      }}
      itemToStringLabel={(field: IField) => field.name}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={selectedField?.name || placeholder}
        showClear={!!selectedField}
        className={className}
      />
      <ComboboxContent>
        <ComboboxEmpty>Nenhum campo encontrado.</ComboboxEmpty>
        {status === 'pending' && (
          <div className="flex items-center justify-center p-3">
            <Spinner className="opacity-50" />
          </div>
        )}
        {status === 'success' && (
          <ComboboxList>
            {(field: IField): React.ReactNode => (
              <ComboboxItem
                key={field._id}
                value={field}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{field.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {field.slug}
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
