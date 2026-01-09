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
import { useGroupReadList } from '@/hooks/tanstack-query/use-group-read-list';
import { USER_GROUP_MAPPER } from '@/lib/constant';
import type { IGroup } from '@/lib/interfaces';

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

  const items =
    groups?.map((g) => ({
      ...g,
      name:
        g.slug in USER_GROUP_MAPPER
          ? USER_GROUP_MAPPER[g.slug as keyof typeof USER_GROUP_MAPPER]
          : g.name,
    })) ?? [];

  // Find selected group
  const selectedGroup = React.useMemo(() => {
    return items.find((g) => g._id === value) ?? null;
  }, [items, value]);

  return (
    <Combobox
      items={items}
      value={selectedGroup}
      onValueChange={(group: IGroup | null) => {
        onValueChange?.(group?._id ?? '');
      }}
      itemToStringLabel={(group: IGroup) => group.name}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={selectedGroup?.name || placeholder}
        showClear={!!selectedGroup}
        className={className}
      />
      <ComboboxContent>
        <ComboboxEmpty>Nenhum grupo encontrado.</ComboboxEmpty>
        {status === 'pending' && (
          <div className="flex items-center justify-center p-3">
            <Spinner className="opacity-50" />
          </div>
        )}
        {status === 'success' && (
          <ComboboxList>
            {(group: IGroup): React.ReactNode => (
              <ComboboxItem
                key={group._id}
                value={group}
              >
                {group.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
