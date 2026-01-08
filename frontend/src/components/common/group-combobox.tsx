import * as React from 'react';

import { Combobox } from '@/components/ui/combobox';
import { useGroupReadList } from '@/hooks/tanstack-query/use-group-read-list';

interface GroupComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function GroupCombobox({
  value = '',
  onValueChange,
  placeholder = 'Selecione um grupo...',
  className,
  disabled = false,
}: GroupComboboxProps): React.JSX.Element {
  const { data: groups, status } = useGroupReadList();

  return (
    <Combobox
      value={value ? [value] : []}
      onChange={(ids) => onValueChange?.(ids[0] ?? '')}
      items={groups ?? []}
      loading={status === 'pending'}
      getItemId={(group) => group._id}
      getItemLabel={(group) => group.name}
      placeholder={placeholder}
      emptyMessage="Nenhum grupo encontrado."
      className={className}
      disabled={disabled}
    />
  );
}
