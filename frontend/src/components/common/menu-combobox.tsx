import * as React from 'react';

import { Combobox } from '@/components/ui/combobox';
import { useMenuReadList } from '@/hooks/tanstack-query/use-menu-read-list';
import { E_MENU_ITEM_TYPE } from '@/lib/constant';
import type { IMenu } from '@/lib/interfaces';

interface MenuComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeId?: string;
}

export function MenuCombobox({
  value = '',
  onValueChange,
  placeholder = 'Selecione um menu pai...',
  className,
  disabled = false,
  excludeId,
}: MenuComboboxProps): React.JSX.Element {
  const { data: menus, status } = useMenuReadList();

  const availableMenus = React.useMemo(() => {
    if (!menus) return [];

    return menus.filter((menu) => {
      if (excludeId && menu._id === excludeId) return false;
      if (menu.type === E_MENU_ITEM_TYPE.SEPARATOR) return true;
      if (!menu.parent) return true;
      return false;
    });
  }, [menus, excludeId]);

  return (
    <Combobox
      value={value ? [value] : []}
      onChange={(ids) => onValueChange?.(ids[0] ?? '')}
      items={availableMenus}
      loading={status === 'pending'}
      getItemId={(menu) => menu._id}
      getItemLabel={(menu) => menu.name}
      renderItem={(menu: IMenu) => (
        <div className="flex flex-col">
          <span className="font-medium">{menu.name}</span>
          <span className="text-xs text-muted-foreground">
            {menu.slug} • {menu.type}
          </span>
        </div>
      )}
      placeholder={placeholder}
      emptyMessage="Nenhum menu encontrado."
      className={className}
      disabled={disabled}
    />
  );
}
