import type { LinkProps } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  ExternalLinkIcon,
  FileTextIcon,
  LayoutListIcon,
  PlusCircleIcon,
  TableIcon,
  WrenchIcon,
} from 'lucide-react';
import { useMemo } from 'react';

import { useExtensionsActiveList } from './use-extensions-active-list';
import type { IActiveExtension } from './use-extensions-active-list';
import { useMenuReadList } from './use-menu-read-list';

import { E_EXTENSION_TYPE, E_MENU_ITEM_TYPE } from '@/lib/constant';
import type { IMenu } from '@/lib/interfaces';
import { getStaticMenusByRole } from '@/lib/menu/menu';
import type { MenuGroupItem, MenuItem, MenuRoute } from '@/lib/menu/menu-route';

// Mapeamento de ícones por tipo de menu
const TYPE_ICONS: Record<string, LucideIcon> = {
  [E_MENU_ITEM_TYPE.TABLE]: TableIcon,
  [E_MENU_ITEM_TYPE.PAGE]: FileTextIcon,
  [E_MENU_ITEM_TYPE.FORM]: PlusCircleIcon,
  [E_MENU_ITEM_TYPE.EXTERNAL]: ExternalLinkIcon,
  [E_MENU_ITEM_TYPE.EXTENSION_MODULE]: WrenchIcon,
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
  const iconUrl = menu.icon ?? null;
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
        iconUrl,
        url: menu.url,
        type: menu.type,
        items: childItems,
      };
    }

    // Sem filhos, é um LinkItem simples
    return {
      title: menu.name,
      icon: Icon,
      iconUrl,
      url: menu.url,
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
      iconUrl,
      type: menu.type,
      items: childItems,
    };
  }

  // SEPARATOR sem filhos: renderizar como item visível (label)
  if (menu.type === E_MENU_ITEM_TYPE.SEPARATOR) {
    return {
      title: menu.name,
      icon: Icon,
      iconUrl,
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

function resolveLucideIcon(name: string | null | undefined): LucideIcon {
  if (!name) return WrenchIcon;
  const candidate = (LucideIcons as Record<string, unknown>)[name];
  if (typeof candidate === 'function' || typeof candidate === 'object') {
    return candidate as LucideIcon;
  }
  return WrenchIcon;
}

function buildToolItems(extensions: Array<IActiveExtension>): Array<MenuItem> {
  return extensions
    .filter((extension) => extension.type === E_EXTENSION_TYPE.TOOL)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map<MenuItem>((extension) => ({
      title: extension.name,
      icon: resolveLucideIcon(extension.icon),
      url: `/tools/${extension.pkg}/${extension.extensionId}`,
    }));
}

/**
 * Injeta as tools ativadas como filhas do item "Ferramentas" do menu estático.
 * Quando há tools, o item vira um CollapsibleItem; sem tools, segue como link
 * para `/tools` (página de listagem).
 */
function injectToolsIntoMenu(
  staticMenu: MenuRoute,
  toolItems: Array<MenuItem>,
): MenuRoute {
  if (toolItems.length === 0) return staticMenu;

  return staticMenu.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.title !== 'Ferramentas') return item;
      return {
        ...item,
        items: toolItems,
      };
    }),
  }));
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

  // 5. Buscar extensões ativas e construir items de tools
  const { data: activeExtensions } = useExtensionsActiveList();
  const toolItems = useMemo(
    () => buildToolItems(activeExtensions ?? []),
    [activeExtensions],
  );

  const staticMenusAfterWithTools = useMemo(
    () => injectToolsIntoMenu(staticMenusAfter, toolItems),
    [staticMenusAfter, toolItems],
  );

  // 6. Combinar: Tabelas → Dinâmicos → Conta/Sistema (com tools injetadas)
  const combinedMenu = useMemo(() => {
    // Se está carregando, adiciona um grupo especial com flag isLoading
    const dynamicPart = isLoading
      ? [{ title: '', items: [], isLoading: true }]
      : dynamicMenuRoute;

    return [...staticMenusBefore, ...dynamicPart, ...staticMenusAfterWithTools];
  }, [
    staticMenusBefore,
    dynamicMenuRoute,
    staticMenusAfterWithTools,
    isLoading,
  ]);

  return { menu: combinedMenu, isLoading };
}
