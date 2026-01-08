import {
  GroupIcon,
  MenuIcon,
  SettingsIcon,
  TableIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';

import { E_ROLE } from '@/lib/constant';

import { MenuRoute } from './menu-route';

export const getStaticMenusByRole = (
  role: string,
): { before: MenuRoute; after: MenuRoute } => {
  const tablesMenu: MenuRoute = [
    {
      title: 'Inicio',
      items: [{ title: 'Tabelas', url: '/tables', icon: TableIcon }],
    },
  ];

  switch (role) {
    case E_ROLE.MASTER:
      return {
        before: tablesMenu,
        after: [
          {
            title: 'Sistema',
            items: [
              {
                title: 'Configurações',
                url: '/settings',
                icon: SettingsIcon,
              },
              { title: 'Menus', url: '/menus', icon: MenuIcon },
              { title: 'Grupos', url: '/groups', icon: GroupIcon },
              { title: 'Usuários', url: '/users', icon: UsersIcon },
            ],
          },
          {
            title: 'Conta',
            items: [{ title: 'Perfil', url: '/profile', icon: UserIcon }],
          },
        ],
      };

    case E_ROLE.ADMINISTRATOR: {
      return {
        before: tablesMenu,
        after: [
          {
            title: 'Sistema',
            items: [
              { title: 'Menus', url: '/menus', icon: MenuIcon },
              { title: 'Usuários', url: '/users', icon: UsersIcon },
            ],
          },
          {
            title: 'Conta',
            items: [{ title: 'Perfil', url: '/profile', icon: UserIcon }],
          },
        ],
      };
    }
    case E_ROLE.MANAGER: {
      return {
        before: tablesMenu,
        after: [
          {
            title: 'Conta',
            items: [{ title: 'Perfil', url: '/profile', icon: UserIcon }],
          },
        ],
      };
    }
    case E_ROLE.REGISTERED:
      return {
        before: tablesMenu,
        after: [
          {
            title: 'Conta',
            items: [{ title: 'Perfil', url: '/profile', icon: UserIcon }],
          },
        ],
      };

    default:
      return { before: [], after: [] };
  }
};
