import {
  GroupIcon,
  MenuIcon,
  SettingsIcon,
  TableIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
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
    case 'MASTER':
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

    case 'ADMINISTRATOR': {
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
    case 'MANAGER': {
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
    case 'REGISTERED':
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
