import * as React from 'react';

import { Combobox } from '@/components/ui/combobox';
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

  return (
    <Combobox
      value={value ? [value] : []}
      onChange={(ids, items) => onValueChange?.(ids[0] ?? '', items[0]?.slug)}
      items={fields}
      loading={status === 'pending'}
      getItemId={(field) => field._id}
      getItemLabel={(field) => field.name}
      renderItem={(field: IField) => (
        <div className="flex flex-col">
          <span className="font-medium">{field.name}</span>
          <span className="text-xs text-muted-foreground">{field.slug}</span>
        </div>
      )}
      placeholder={placeholder}
      emptyMessage="Nenhum campo encontrado."
      className={className}
      disabled={disabled}
    />
  );
}
