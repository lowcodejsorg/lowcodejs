import * as React from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Spinner } from '@/components/ui/spinner';
import { useGroupReadList } from '@/hooks/tanstack-query/use-group-read-list';
import { USER_GROUP_MAPPER } from '@/lib/constant';
import type { IGroup } from '@/lib/interfaces';

interface GroupMultiSelectProps {
  value?: Array<string>;
  onValueChange?: (value: Array<string>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeIds?: Array<string>;
}

function getGroupDisplayName(group: IGroup): string {
  const mapped =
    USER_GROUP_MAPPER[group.slug as keyof typeof USER_GROUP_MAPPER];
  return mapped || group.name;
}

export function GroupMultiSelect({
  value = [],
  onValueChange,
  placeholder = 'Selecione grupos...',
  className,
  disabled = false,
  excludeIds = [],
}: GroupMultiSelectProps): React.JSX.Element {
  const anchorRef = useComboboxAnchor();
  const { data: groups, status } = useGroupReadList();

  const items = React.useMemo(() => {
    const all = groups ?? [];
    if (excludeIds.length === 0) return all;
    return all.filter((g) => !excludeIds.includes(g._id));
  }, [groups, excludeIds]);

  const selectedGroups = React.useMemo(() => {
    return items.filter((group) => value.includes(group._id));
  }, [items, value]);

  return (
    <Combobox
      data-slot="group-multi-select"
      data-test-id="group-multi-select"
      items={items}
      multiple
      value={selectedGroups}
      onValueChange={(newGroups: Array<IGroup>) => {
        onValueChange?.(newGroups.map((g) => g._id));
      }}
      itemToStringLabel={(group: IGroup) => getGroupDisplayName(group)}
      disabled={disabled}
    >
      <ComboboxChips
        ref={anchorRef}
        className={className}
      >
        <ComboboxValue>
          {(selectedValue: Array<IGroup>): React.ReactNode => {
            let chipsPlaceholder = placeholder;
            if (selectedValue.length > 0) {
              chipsPlaceholder = '';
            }
            return (
              <React.Fragment>
                {selectedValue.map((group) => (
                  <ComboboxChip
                    key={group._id}
                    aria-label={getGroupDisplayName(group)}
                  >
                    {getGroupDisplayName(group)}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder={chipsPlaceholder} />
              </React.Fragment>
            );
          }}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>Nenhum grupo encontrado.</ComboboxEmpty>
        {status === 'pending' && (
          <div className="flex items-center justify-center p-3">
            <Spinner className="opacity-50" />
          </div>
        )}
        {status !== 'pending' && (
          <ComboboxList>
            {(group: IGroup): React.ReactNode => (
              <ComboboxItem
                key={group._id}
                value={group}
              >
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">
                    {getGroupDisplayName(group)}
                  </span>
                  {group.description && (
                    <span className="text-muted-foreground text-sm">
                      {group.description}
                    </span>
                  )}
                </div>
              </ComboboxItem>
            )}
          </ComboboxList>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
