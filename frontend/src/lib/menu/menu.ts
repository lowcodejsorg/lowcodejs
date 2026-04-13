import {
  GroupIcon,
  MenuIcon,
  SettingsIcon,
  TableIcon,
  UserIcon,
  UsersIcon,
  WrenchIcon,
} from 'lucide-react';

import type { MenuItem, MenuRoute } from './menu-route';

export const getStaticMenusByPermissions = (
  permissions: Record<string, boolean>,
): { before: MenuRoute; after: MenuRoute } => {
  const systemItems: Array<MenuItem> = [];

  systemItems.push({ title: 'Tabelas', url: '/tables', icon: TableIcon });

  if (permissions.SETTINGS === true) {
    systemItems.push({
      title: 'Configurações',
      url: '/settings',
      icon: SettingsIcon,
    });
  }

  if (permissions.MENU === true) {
    systemItems.push({ title: 'Menus', url: '/menus', icon: MenuIcon });
  }

  if (permissions.USER_GROUPS === true) {
    systemItems.push({ title: 'Grupos', url: '/groups', icon: GroupIcon });
  }

  if (permissions.USERS === true) {
    systemItems.push({ title: 'Usuários', url: '/users', icon: UsersIcon });
  }

  if (permissions.TOOLS === true) {
    systemItems.push({
      title: 'Ferramentas',
      url: '/tools',
      icon: WrenchIcon,
    });
  }

  return {
    before: [],
    after: [
      {
        title: 'Sistema',
        items: systemItems,
      },
      {
        title: 'Conta',
        items: [{ title: 'Perfil', url: '/profile', icon: UserIcon }],
      },
    ],
  };
};
