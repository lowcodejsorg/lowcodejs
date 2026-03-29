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
}

export function UserMultiSelect({
  value = [],
  onValueChange,
  placeholder = 'Selecione administradores...',
  className,
  disabled = false,
}: UserMultiSelectProps): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const anchorRef = useComboboxAnchor();
  const [selectedCache, setSelectedCache] = React.useState<Map<string, IUser>>(
    () => new Map(),
  );

  const { data: usersData, status } = useUserReadPaginated({
    page: 1,
    perPage: 50,
    search: search || undefined,
  });

  const users = React.useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.filter(
      (user) => user.status === E_USER_STATUS.ACTIVE,
    );
  }, [usersData?.data]);

  React.useEffect(() => {
    if (!users.length) return;
    setSelectedCache((prev) => {
      const next = new Map(prev);
      users.forEach((user) => next.set(user._id, user));
      return next;
    });
  }, [users]);

  // Map selected IDs to user objects (fallback to label stub)
  const selectedUsers = React.useMemo(() => {
    return value.map((id) => {
      const cached = selectedCache.get(id);
      const fromList = users.find((user) => user._id === id);
      if (cached) return cached;
      if (fromList) return fromList;
      return {
        _id: id,
        name: id,
        email: '',
        password: '',
        status: E_USER_STATUS.ACTIVE,
        group: null as unknown as IUser['group'],
      };
    });
  }, [selectedCache, users, value]);

  const items = React.useMemo(() => {
    const cachedUsers = users.map(
      (user) => selectedCache.get(user._id) ?? user,
    );
    const userIds = new Set(cachedUsers.map((user) => user._id));
    const extras = selectedUsers.filter((user) => !userIds.has(user._id));
    if (extras.length) {
      return [...cachedUsers, ...extras];
    }
    return cachedUsers;
  }, [selectedCache, selectedUsers, users]);

  const handleToggleUser = (user: IUser): void => {
    let nextIds: Array<string>;
    if (value.includes(user._id)) {
      nextIds = value.filter((id) => id !== user._id);
    } else {
      nextIds = [...value, user._id];
    }
    setSelectedCache((prev) => {
      const next = new Map(prev);
      next.set(user._id, user);
      return next;
    });
    onValueChange?.(nextIds);
    if (search.trim().length > 0) {
      setSearch('');
    }
  };

  return (
    <Combobox
      data-slot="user-multi-select"
      data-test-id="user-multi-select"
      items={items}
      multiple
      value={selectedUsers as Array<IUser>}
      onValueChange={() => null}
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
          {(selectedValue: Array<IUser>): React.ReactNode => {
            let chipsPlaceholder = placeholder;
            if (selectedValue.length > 0) {
              chipsPlaceholder = '';
            }
            return (
              <React.Fragment>
                {selectedValue.map((user) => (
                  <ComboboxChip
                    key={user._id}
                    aria-label={user.name}
                  >
                    {user.name}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder={chipsPlaceholder} />
              </React.Fragment>
            );
          }}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>Nenhum usuário encontrado.</ComboboxEmpty>
        {status === 'pending' && (
          <div className="text-muted-foreground p-3 text-center text-sm">
            Carregando...
          </div>
        )}
        {status !== 'pending' && (
          <ComboboxList>
            {(user: IUser): React.ReactNode => (
              <ComboboxItem
                key={user._id}
                value={user}
                onClick={() => handleToggleUser(user)}
              >
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground text-sm">
                    {user.email}
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
