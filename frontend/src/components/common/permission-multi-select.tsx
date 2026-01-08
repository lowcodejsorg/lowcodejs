import * as React from 'react';

import { Combobox } from '@/components/ui/combobox';
import { usePermissionRead } from '@/hooks/tanstack-query/use-permission-read';
import type { IPermission } from '@/lib/interfaces';

interface PermissionMultiSelectProps {
  value?: Array<string>;
  onValueChange?: (value: Array<string>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PermissionMultiSelect({
  value = [],
  onValueChange,
  placeholder = 'Selecione permissões...',
  className,
  disabled = false,
}: PermissionMultiSelectProps): React.JSX.Element {
  const { data: permissions, status } = usePermissionRead();

  return (
    <Combobox
      value={value}
      onChange={(ids) => onValueChange?.(ids)}
      items={permissions ?? []}
      loading={status === 'pending'}
      getItemId={(permission) => permission._id}
      getItemLabel={(permission) => permission.name}
      renderItem={(permission: IPermission) => (
        <div className="flex flex-col flex-1">
          <span className="font-medium">{permission.name}</span>
          {permission.description && (
            <span className="text-sm text-muted-foreground">
              {permission.description}
            </span>
          )}
        </div>
      )}
      placeholder={placeholder}
      emptyMessage="Nenhuma permissão encontrada."
      className={className}
      disabled={disabled}
      multiple
    />
  );
}
