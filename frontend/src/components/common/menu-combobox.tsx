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

  // Find selected menu
  const selectedMenu = React.useMemo(() => {
    return availableMenus.find((m) => m._id === value) ?? null;
  }, [availableMenus, value]);

  return (
    <Combobox
      items={availableMenus}
      value={selectedMenu}
      onValueChange={(menu: IMenu | null) => {
        onValueChange?.(menu?._id ?? '');
      }}
      itemToStringLabel={(menu: IMenu) => menu.name}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={selectedMenu?.name || placeholder}
        showClear={!!selectedMenu}
        className={className}
      />
      <ComboboxContent>
        <ComboboxEmpty>Nenhum menu encontrado.</ComboboxEmpty>
        {status === 'pending' && (
          <div className="flex items-center justify-center p-3">
            <Spinner className="opacity-50" />
          </div>
        )}
        {status === 'success' && (
          <ComboboxList>
            {(menu: IMenu): React.ReactNode => (
              <ComboboxItem
                key={menu._id}
                value={menu}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{menu.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {menu.slug} • {menu.type}
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
