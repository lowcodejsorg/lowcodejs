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
  const anchorRef = useComboboxAnchor();
  const { data: permissions, status } = usePermissionRead();

  const items = permissions ?? [];

  // Map selected IDs to permission objects
  const selectedPermissions = React.useMemo(() => {
    return items.filter((permission) => value.includes(permission._id));
  }, [items, value]);

  return (
    <Combobox
      items={items}
      multiple
      value={selectedPermissions}
      onValueChange={(newPermissions: Array<IPermission>) => {
        onValueChange?.(newPermissions.map((p) => p._id));
      }}
      itemToStringLabel={(permission: IPermission) => permission.name}
      disabled={disabled}
    >
      <ComboboxChips
        ref={anchorRef}
        className={className}
      >
        <ComboboxValue>
          {(selectedValue: Array<IPermission>): React.ReactNode => (
            <React.Fragment>
              {selectedValue.map((permission) => (
                <ComboboxChip
                  key={permission._id}
                  aria-label={permission.name}
                >
                  {permission.name}
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
        <ComboboxEmpty>Nenhuma permissão encontrada.</ComboboxEmpty>
        <ComboboxList>
          {status === 'pending' ? (
            <div className="flex items-center justify-center p-3">
              <Spinner className="opacity-50" />
            </div>
          ) : (
            (permission: IPermission): React.ReactNode => (
              <ComboboxItem
                key={permission._id}
                value={permission}
              >
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{permission.name}</span>
                  {permission.description && (
                    <span className="text-muted-foreground text-sm">
                      {permission.description}
                    </span>
                  )}
                </div>
              </ComboboxItem>
            )
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
