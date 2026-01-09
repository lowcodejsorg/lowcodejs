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
import { useUserReadPaginated } from '@/hooks/tanstack-query/use-user-read-paginated';
import { E_USER_STATUS } from '@/lib/constant';
import type { IUser } from '@/lib/interfaces';

interface UserMultiSelectProps {
  value?: Array<string>;
  onValueChange?: (value: Array<string>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeUserId?: string;
}

export function UserMultiSelect({
  value = [],
  onValueChange,
  placeholder = 'Selecione administradores...',
  className,
  disabled = false,
  excludeUserId,
}: UserMultiSelectProps): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const anchorRef = useComboboxAnchor();

  const { data: usersData, status } = useUserReadPaginated({
    page: 1,
    perPage: 50,
    search: search || undefined,
  });

  const users = React.useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.filter(
      (user) =>
        user.status === E_USER_STATUS.ACTIVE && user._id !== excludeUserId,
    );
  }, [usersData?.data, excludeUserId]);

  // Map selected IDs to user objects
  const selectedUsers = React.useMemo(() => {
    return users.filter((user) => value.includes(user._id));
  }, [users, value]);

  return (
    <Combobox
      items={users}
      multiple
      value={selectedUsers}
      onValueChange={(newUsers: Array<IUser>) => {
        onValueChange?.(newUsers.map((u) => u._id));
      }}
      inputValue={search}
      onInputValueChange={setSearch}
      itemToStringLabel={(user: IUser) => user.name}
      disabled={disabled}
    >
      <ComboboxChips
        ref={anchorRef}
        className={className}
      >
        <ComboboxValue>
          {(selectedValue: Array<IUser>): React.ReactNode => (
            <React.Fragment>
              {selectedValue.map((user) => (
                <ComboboxChip
                  key={user._id}
                  aria-label={user.name}
                >
                  {user.name}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={selectedValue.length > 0 ? '' : placeholder}
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>Nenhum usuário encontrado.</ComboboxEmpty>
        <ComboboxList>
          {status === 'pending' ? (
            <div className="text-muted-foreground p-3 text-center text-sm">
              Carregando...
            </div>
          ) : (
            (user: IUser): React.ReactNode => (
              <ComboboxItem
                key={user._id}
                value={user}
              >
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground text-sm">
                    {user.email}
                  </span>
                </div>
              </ComboboxItem>
            )
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
