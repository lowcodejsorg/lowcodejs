import React from 'react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { useUserReadPaginated } from '@/hooks/tanstack-query/use-user-read-paginated';
import type { IUser } from '@/lib/interfaces';

interface ForumUserMultiSelectProps {
  value: Array<string>;
  onChange: (value: Array<string>) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ForumUserMultiSelect({
  value,
  onChange,
  disabled,
  placeholder,
}: ForumUserMultiSelectProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const anchorRef = useComboboxAnchor();
  const [selectedCache, setSelectedCache] = React.useState<Map<string, IUser>>(
    () => new Map(),
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return (): void => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useUserReadPaginated({
    page: 1,
    perPage: 50,
    search: debouncedQuery || undefined,
  });

  const users = React.useMemo(() => data?.data ?? [], [data?.data]);

  React.useEffect(() => {
    if (!users.length) return;
    setSelectedCache((prev) => {
      const next = new Map(prev);
      users.forEach((user) => next.set(user._id, user));
      return next;
    });
  }, [users]);

  const selectedUsers = React.useMemo(
    () =>
      value
        .map((id) => selectedCache.get(id))
        .filter((item): item is IUser => Boolean(item)),
    [selectedCache, value],
  );

  const items = React.useMemo(() => {
    if (!selectedUsers.length) return users;
    const userIds = new Set(users.map((user) => user._id));
    const extras = selectedUsers.filter((user) => !userIds.has(user._id));
    return extras.length ? [...users, ...extras] : users;
  }, [selectedUsers, users]);

  return (
    <Combobox
      items={items}
      multiple
      value={selectedUsers}
      onValueChange={(selected) => {
        setSelectedCache((prev) => {
          const next = new Map(prev);
          selected.forEach((user) => next.set(user._id, user));
          return next;
        });
        onChange(selected.map((user) => user._id));
      }}
      inputValue={searchQuery}
      onInputValueChange={setSearchQuery}
      itemToStringLabel={(user: IUser) => user.name}
      disabled={disabled}
    >
      <ComboboxChips ref={anchorRef}>
        <ComboboxValue>
          {(values: Array<IUser>): React.ReactNode => (
            <React.Fragment>
              {values.slice(0, 3).map((user) => (
                <ComboboxChip
                  key={user._id}
                  aria-label={user.name}
                >
                  {user.name}
                </ComboboxChip>
              ))}
              {values.length > 3 && (
                <span className="text-muted-foreground text-xs">
                  +{values.length - 3}
                </span>
              )}
              <ComboboxChipsInput
                placeholder={
                  values.length > 0 ? '' : (placeholder ?? 'Mencionar usuarios')
                }
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>Nenhum usuário encontrado</ComboboxEmpty>
        {!isLoading && (
          <ComboboxList>
            {(user: IUser): React.ReactNode => (
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
            )}
          </ComboboxList>
        )}
        {isLoading && (
          <div className="p-3">
            <Skeleton className="h-6 w-full" />
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
