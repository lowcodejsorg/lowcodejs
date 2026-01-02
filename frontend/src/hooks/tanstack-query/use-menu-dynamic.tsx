/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
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

import type { IMenu } from '@/lib/interfaces';
import { getStaticMenusByRole } from '@/lib/menu/menu';
import type { MenuGroupItem, MenuRoute } from '@/lib/menu/menu-route';

// Mapeamento de ícones por tipo de menu
const TYPE_ICONS: Record<string, LucideIcon> = {
  table: TableIcon,
  list: LayoutListIcon,
  page: FileTextIcon,
  form: PlusCircleIcon,
  external: ExternalLinkIcon,
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
 * Converte um menu com filhos para item do MenuRoute
 */
function convertMenuToItem(menu: MenuWithChildren) {
  const Icon = TYPE_ICONS[menu.type] || LayoutListIcon;
  const hasChildren = menu.children && menu.children.length > 0;

  // Menu com URL (pode ter filhos ou não)
  if (menu.url) {
    // Se tem filhos, é um CollapsibleItem
    if (hasChildren) {
      return {
        title: menu.name,
        icon: Icon,
        url: menu.url,
        type: menu.type,
        items: menu.children!.map((child) => ({
          title: child.name,
          icon: TYPE_ICONS[child.type] || LayoutListIcon,
          url: child.url || '#',
          type: child.type,
        })),
      };
    }

    // Sem filhos, é um LinkItem simples
    return {
      title: menu.name,
      icon: Icon,
      url: menu.url,
      type: menu.type,
    };
  }

  // Menu sem URL (separator ou parent)
  if (hasChildren) {
    return {
      title: menu.name,
      icon: Icon,
      type: menu.type,
      items: menu.children!.map((child) => ({
        title: child.name,
        icon: TYPE_ICONS[child.type] || LayoutListIcon,
        url: child.url || '#',
        type: child.type,
      })),
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

  const items: Array<any> = [];

  for (const menu of menuTree) {
    // Se é SEPARATOR, cria CollapsibleItem com seus filhos
    if (menu.type.toLocaleLowerCase() === 'separator') {
      if (menu.children && menu.children.length > 0) {
        items.push({
          title: menu.name,
          icon: TYPE_ICONS[menu.type] || LayoutListIcon,
          type: menu.type,
          items: menu.children.map((child) => ({
            title: child.name,
            url: child.url || '#',
            icon: TYPE_ICONS[child.type] || LayoutListIcon,
            type: child.type,
          })),
        });
      }
    } else {
      // Menu normal (não separator)
      const item = convertMenuToItem(menu);
      if (item) {
        items.push(item);
      }
    }
  }

  // Retorna um único grupo "Menu" com todos os items
  return items.length > 0
    ? [
        {
          title: 'Menu',
          items: items,
        },
      ]
    : [];
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
      ? [{ title: 'Menu', items: [], isLoading: true }]
      : dynamicMenuRoute;

    return [...staticMenusBefore, ...dynamicPart, ...staticMenusAfter];
  }, [staticMenusBefore, dynamicMenuRoute, staticMenusAfter, isLoading]);

  return { menu: combinedMenu, isLoading };
}
