import type { LinkProps } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  ExternalLinkIcon,
  FileTextIcon,
  LayoutListIcon,
  PlusCircleIcon,
  TableIcon,
} from 'lucide-react';
import { useMemo } from 'react';

import { useMenuReadList } from './use-menu-read-list';

import { E_MENU_ITEM_TYPE } from '@/lib/constant';
import type { IMenu } from '@/lib/interfaces';
import { getStaticMenusByRole } from '@/lib/menu/menu';
import type { MenuGroupItem, MenuItem, MenuRoute } from '@/lib/menu/menu-route';

// Mapeamento de ícones por tipo de menu
const TYPE_ICONS: Record<string, LucideIcon> = {
  [E_MENU_ITEM_TYPE.TABLE]: TableIcon,
  [E_MENU_ITEM_TYPE.PAGE]: FileTextIcon,
  [E_MENU_ITEM_TYPE.FORM]: PlusCircleIcon,
  [E_MENU_ITEM_TYPE.EXTERNAL]: ExternalLinkIcon,
};

// Tipo para menu com children
type MenuWithChildren = IMenu & { children?: Array<MenuWithChildren> };

/**
 * Função para construir a árvore hierárquica de menus
 */
function buildMenuTree(menus: Array<IMenu>): Array<MenuWithChildren> {
  if (!Array.isArray(menus)) return [];

  const menuMap = new Map<string, MenuWithChildren>();
  const rootMenus: Array<MenuWithChildren> = [];

  // Primeiro, criar um mapa de todos os menus
  for (const menu of menus) {
    menuMap.set(menu._id, { ...menu, children: [] });
  }

  // Depois, construir a hierarquia
  for (const menu of menus) {
    const menuWithChildren = menuMap.get(menu._id)!;
    const parentId =
      typeof menu.parent === 'string' ? menu.parent : menu.parent?._id;

    if (parentId) {
      const parent = menuMap.get(parentId);

      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(menuWithChildren);
      }

      if (!parent) {
        rootMenus.push(menuWithChildren);
      }
    }

    if (!parentId) {
      rootMenus.push(menuWithChildren);
    }
  }

  return rootMenus;
}

/**
 * Converte um menu com filhos para item do MenuRoute (recursivo)
 */
function convertMenuToItem(menu: MenuWithChildren): MenuItem | null {
  const Icon = TYPE_ICONS[menu.type] || LayoutListIcon;
  const hasChildren = menu.children && menu.children.length > 0;

  // Menu com URL (pode ter filhos ou não)
  if (menu.url) {
    // Se tem filhos, é um CollapsibleItem
    if (hasChildren) {
      const childItems: Array<MenuItem> = [];
      for (const child of menu.children!) {
        const childItem = convertMenuToItem(child);
        if (childItem) {
          childItems.push(childItem);
        }
      }

      return {
        title: menu.name,
        icon: Icon,
        url: menu.url as LinkProps['to'],
        type: menu.type,
        items: childItems,
      };
    }

    // Sem filhos, é um LinkItem simples
    return {
      title: menu.name,
      icon: Icon,
      url: menu.url as LinkProps['to'],
      type: menu.type,
    };
  }

  // Menu sem URL (separator ou parent)
  if (hasChildren) {
    const childItems: Array<MenuItem> = [];
    for (const child of menu.children!) {
      const childItem = convertMenuToItem(child);
      if (childItem) {
        childItems.push(childItem);
      }
    }

    return {
      title: menu.name,
      icon: Icon,
      type: menu.type,
      items: childItems,
    };
  }

  // SEPARATOR sem filhos: renderizar como item visível (label)
  if (menu.type === E_MENU_ITEM_TYPE.SEPARATOR) {
    return {
      title: menu.name,
      icon: Icon,
      type: menu.type,
      items: [],
    };
  }

  // Fallback: menu sem URL e sem filhos (não deveria acontecer)
  return null;
}

/**
 * Converte árvore de menus dinâmicos para formato MenuRoute
 */
function convertToMenuRoute(menuTree: Array<MenuWithChildren>): MenuRoute {
  if (menuTree.length === 0) return [];

  const items: Array<MenuItem> = [];

  for (const menu of menuTree) {
    const item = convertMenuToItem(menu);
    if (item) {
      items.push(item);
    }
  }

  // Retorna um único grupo sem título (título vazio = sem rótulo)
  if (items.length > 0) {
    return [
      {
        title: '',
        items: items,
      },
    ];
  }

  return [];
}

/**
 * Hook para obter menus dinâmicos combinados com menus estáticos
 */
export function useMenuDynamic(role: string): {
  menu: Array<MenuGroupItem>;
  isLoading: boolean;
} {
  // 1. Buscar menus dinâmicos da API
  const { data: dynamicMenusData, isLoading } = useMenuReadList();

  // Normalizar os dados - pode ser array direto ou { data: [] }
  const menuData = useMemo(() => {
    if (!dynamicMenusData) return [];
    if (Array.isArray(dynamicMenusData)) return dynamicMenusData;
    return [];
  }, [dynamicMenusData]);

  // 2. Construir árvore hierárquica
  const dynamicMenuTree = useMemo(() => {
    return buildMenuTree(menuData);
  }, [menuData]);

  // 3. Converter menus dinâmicos para formato MenuRoute
  const dynamicMenuRoute = useMemo(() => {
    return convertToMenuRoute(dynamicMenuTree);
  }, [dynamicMenuTree]);

  // 4. Obter menus estáticos baseados no role (before e after)
  const { before: staticMenusBefore, after: staticMenusAfter } = useMemo(() => {
    return getStaticMenusByRole(role);
  }, [role]);

  // 5. Combinar: Tabelas → Dinâmicos → Conta/Sistema
  const combinedMenu = useMemo(() => {
    // Se está carregando, adiciona um grupo especial com flag isLoading
    const dynamicPart = isLoading
      ? [{ title: '', items: [], isLoading: true }]
      : dynamicMenuRoute;

    return [...staticMenusBefore, ...dynamicPart, ...staticMenusAfter];
  }, [staticMenusBefore, dynamicMenuRoute, staticMenusAfter, isLoading]);

  return { menu: combinedMenu, isLoading };
}
