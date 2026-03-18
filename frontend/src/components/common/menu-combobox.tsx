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
import type { IMenu } from '@/lib/interfaces';

interface MenuComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeId?: string;
}

function getDescendantIds(menus: Array<IMenu>, rootId: string): Set<string> {
  const descendants = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const menu of menus) {
      const parentId =
        typeof menu.parent === 'string' ? menu.parent : menu.parent?._id;
      if (parentId === currentId && !descendants.has(menu._id)) {
        descendants.add(menu._id);
        queue.push(menu._id);
      }
    }
  }

  return descendants;
}

function getMenuDepth(menu: IMenu, menuMap: Map<string, IMenu>): number {
  let depth = 0;
  let current = menu;

  while (current.parent) {
    const parentId =
      typeof current.parent === 'string' ? current.parent : current.parent?._id;
    if (!parentId) break;
    const parentMenu = menuMap.get(parentId);
    if (!parentMenu) break;
    depth++;
    current = parentMenu;
  }

  return depth;
}

function getBreadcrumb(menu: IMenu, menuMap: Map<string, IMenu>): string {
  const parts: Array<string> = [];
  let current = menu;

  while (current.parent) {
    const parentId =
      typeof current.parent === 'string' ? current.parent : current.parent?._id;
    if (!parentId) break;
    const parentMenu = menuMap.get(parentId);
    if (!parentMenu) break;
    parts.unshift(parentMenu.name);
    current = parentMenu;
  }

  if (parts.length === 0) return `${menu.slug} • ${menu.type}`;
  return parts.join(' > ');
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

  const menuMap = React.useMemo(() => {
    if (!menus) return new Map<string, IMenu>();
    const map = new Map<string, IMenu>();
    for (const menu of menus) {
      map.set(menu._id, menu);
    }
    return map;
  }, [menus]);

  const excludedIds = React.useMemo(() => {
    if (!menus || !excludeId) return new Set<string>();
    const descendants = getDescendantIds(menus, excludeId);
    descendants.add(excludeId);
    return descendants;
  }, [menus, excludeId]);

  const availableMenus = React.useMemo(() => {
    if (!menus) return [];

    return menus.filter((menu) => {
      if (excludedIds.has(menu._id)) return false;
      return true;
    });
  }, [menus, excludedIds]);

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
            {(menu: IMenu): React.ReactNode => {
              const depth = getMenuDepth(menu, menuMap);
              const breadcrumb = getBreadcrumb(menu, menuMap);

              return (
                <ComboboxItem
                  key={menu._id}
                  value={menu}
                >
                  <div
                    className="flex flex-col"
                    style={{ paddingLeft: `${depth * 16}px` }}
                  >
                    <span className="font-medium">{menu.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {breadcrumb}
                    </span>
                  </div>
                </ComboboxItem>
              );
            }}
          </ComboboxList>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
