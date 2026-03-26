import { Link, useLocation, useRouter } from '@tanstack/react-router';
import { ChevronRightIcon, LogOutIcon } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar as Root,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthenticationSignOut } from '@/hooks/tanstack-query/use-authentication-sign-out';
import { useSettingRead } from '@/hooks/tanstack-query/use-setting-read';
import { E_MENU_ITEM_TYPE } from '@/lib/constant';
import { handleApiError } from '@/lib/handle-api-error';
import type { MenuItem, MenuRoute } from '@/lib/menu/menu-route';
import { toastSuccess } from '@/lib/toast';

interface SidebarProps {
  menu: MenuRoute;
}

const MAX_DEPTH = 4;

function SidebarMenuItemRecursive({
  item,
  depth,
  location,
  setOpenMobile,
}: {
  item: MenuItem;
  depth: number;
  location: { pathname: string };
  setOpenMobile: (open: boolean) => void;
}): React.JSX.Element {
  // CollapsibleItem with sub-items
  if ('items' in item && item.items && item.items.length > 0) {
    return (
      <Collapsible
        key={item.title}
        asChild
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title}>
              {item.icon && (
                <item.icon
                  className="text-primary"
                  width={32}
                />
              )}
              <span>{item.title}</span>
              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((subItem) => {
                // If sub-item has its own children and we haven't hit max depth, recurse
                if (
                  'items' in subItem &&
                  subItem.items &&
                  subItem.items.length > 0 &&
                  depth < MAX_DEPTH
                ) {
                  return (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuItemRecursive
                        item={subItem}
                        depth={depth + 1}
                        location={location}
                        setOpenMobile={setOpenMobile}
                      />
                    </SidebarMenuSubItem>
                  );
                }

                const isExternal =
                  'type' in subItem &&
                  subItem.type === E_MENU_ITEM_TYPE.EXTERNAL;

                const subUrl = String(subItem.url?.toString() ?? '#').replace(
                  /\/$/,
                  '',
                );

                let subItemLink: React.ReactNode;
                if (isExternal) {
                  subItemLink = (
                    <a
                      href={subUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpenMobile(false)}
                    >
                      {subItem.icon && (
                        <subItem.icon className="text-primary size-4" />
                      )}
                      <span>{subItem.title}</span>
                    </a>
                  );
                } else {
                  subItemLink = (
                    <Link
                      to={subUrl}
                      onClick={() => setOpenMobile(false)}
                    >
                      {subItem.icon && (
                        <subItem.icon className="text-primary size-4" />
                      )}
                      <span>{subItem.title}</span>
                    </Link>
                  );
                }

                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={!isExternal && location.pathname === subUrl}
                    >
                      {subItemLink}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  // SEPARATOR sem filhos: renderizar como label estático (sem link, sem collapsible)
  if (
    'type' in item &&
    item.type === E_MENU_ITEM_TYPE.SEPARATOR &&
    (!('items' in item) || !item.items || item.items.length === 0)
  ) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={item.title}>
          {item.icon && (
            <item.icon
              className="text-primary"
              width={32}
            />
          )}
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Simple LinkItem
  const to = String(item.url?.toString() ?? '/').replace(/\/$/, '');
  const isExternal = 'type' in item && item.type === E_MENU_ITEM_TYPE.EXTERNAL;

  let itemLink: React.ReactNode;
  if (isExternal) {
    itemLink = (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setOpenMobile(false)}
      >
        {item.icon && (
          <item.icon
            className="text-primary group-data-[active=true]:text-primary-foreground"
            width={32}
          />
        )}
        <span>{item.title}</span>
      </a>
    );
  } else {
    itemLink = (
      <Link
        to={to}
        onClick={() => setOpenMobile(false)}
      >
        {item.icon && (
          <item.icon
            className="text-primary group-data-[active=true]:text-primary-foreground"
            width={32}
          />
        )}
        <span>{item.title}</span>
        {item.badge && (
          <Badge className="rounded-full px-1  text-xs">{item.badge}</Badge>
        )}
      </Link>
    );
  }

  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        className="group data-[active=true]:bg-primary data-[active=true]:text-primary-foreground "
        isActive={!isExternal && location.pathname === to}
        tooltip={item.title}
      >
        {itemLink}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function Sidebar({ menu }: SidebarProps): React.JSX.Element {
  const { setOpenMobile } = useSidebar();
  const location = useLocation();

  const router = useRouter();

  const { state } = useSidebar();

  const setting = useSettingRead();

  const signOut = useAuthenticationSignOut({
    onSuccess() {
      toastSuccess('Logout realizado com sucesso!', 'Volte sempre!');

      router.navigate({
        to: '/',
        replace: true,
      });
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao fazer logout' });
    },
  });

  return (
    <Root
      data-slot="sidebar"
      // collapsible="icon"
      // variant="floating"
    >
      <SidebarHeader className="inline-flex items-center justify-center py-6">
        {setting.status === 'pending' && <Skeleton className="h-8 w-32" />}
        {setting.status === 'success' && (
          <img
            src={setting.data.LOGO_LARGE_URL ?? ''}
            className="w-32"
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        {menu.map((props) => {
          // Se o grupo tem a flag isLoading, renderiza skeleton
          if (props.isLoading) {
            return (
              <SidebarGroup key="dynamic-loading">
                {props.title && (
                  <SidebarGroupLabel>
                    <Skeleton className="h-4 w-24" />
                  </SidebarGroupLabel>
                )}
                <SidebarMenu>
                  {[1, 2, 3].map((i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuButton>
                        <Skeleton className="size-4 rounded" />
                        <Skeleton className="h-4 w-32" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            );
          }

          return (
            <SidebarGroup key={props.title || 'dynamic-menu'}>
              {props.title && (
                <SidebarGroupLabel>{props.title}</SidebarGroupLabel>
              )}
              <SidebarMenu>
                {props.items.map((item) => (
                  <SidebarMenuItemRecursive
                    key={item.title}
                    item={item}
                    depth={0}
                    location={location}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
        <SidebarGroup>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => signOut.mutateAsync()}
                    className="w-full rounded-none cursor-pointer"
                  >
                    {signOut.status !== 'pending' && (
                      <LogOutIcon className="text-primary" />
                    )}
                    {signOut.status === 'pending' && <Spinner />}
                    <span>Sair</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </TooltipTrigger>
            {state === 'collapsed' && (
              <TooltipContent side="right">Sair</TooltipContent>
            )}
          </Tooltip>
        </SidebarGroup>
      </SidebarContent>
    </Root>
  );
}
