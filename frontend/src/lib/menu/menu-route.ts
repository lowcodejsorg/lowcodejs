import type { LinkProps } from '@tanstack/react-router';

export interface MenuRouteBaseItem {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  type?: string;
}

export type LinkItem = MenuRouteBaseItem & {
  url: LinkProps['to'];
  items?: never;
};

export type CollapsibleItem = MenuRouteBaseItem & {
  items: Array<MenuRouteBaseItem & { url: LinkProps['to'] }>;
  url?: LinkProps['to'];
};

export type MenuItem = CollapsibleItem | LinkItem;

export type MenuGroupItem = {
  title: string;
  items: Array<MenuItem>;
  isLoading?: boolean;
};

export type MenuRoute = Array<MenuGroupItem>;
