import * as React from 'react';

import { Combobox } from '@/components/ui/combobox';
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

  return (
    <Combobox
      value={value}
      onChange={(ids) => onValueChange?.(ids)}
      items={users}
      loading={status === 'pending'}
      getItemId={(user) => user._id}
      getItemLabel={(user) => user.name}
      getItemSearchValue={(user) => `${user.name} ${user.email}`}
      renderItem={(user: IUser) => (
        <div className="flex flex-col flex-1">
          <span className="font-medium">{user.name}</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      )}
      onSearch={setSearch}
      placeholder={placeholder}
      emptyMessage="Nenhum usuário encontrado."
      className={className}
      disabled={disabled}
      multiple
    />
  );
}
