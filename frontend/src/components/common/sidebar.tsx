import { Link, useLocation, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ChevronRightIcon, LogOutIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

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
import type { MenuRoute } from '@/lib/menu/menu-route';
import { useAuthenticationStore } from '@/stores/authentication';

interface SidebarProps {
  menu: MenuRoute;
}

export function Sidebar({ menu }: SidebarProps): React.JSX.Element {
  const authentication = useAuthenticationStore();

  const { setOpenMobile } = useSidebar();
  const location = useLocation();

  const router = useRouter();

  const { state } = useSidebar();

  const setting = useSettingRead();

  const signOut = useAuthenticationSignOut({
    onSuccess() {
      toast('Logout realizado com sucesso!', {
        className: '!bg-green-500 !text-primary-foreground !border-green-500',
        description: 'Volte sempre!',
        descriptionClassName: '!text-primary-foreground',
        closeButton: true,
      });

      authentication.logout();

      router.navigate({
        to: '/',
        replace: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === 'AUTHENTICATION_REQUIRED') {
          toast.error(data?.message ?? 'Authentication required');
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? 'Erro interno do servidor');
        }
      }

      console.error(error);
    },
  });

  return (
    <Root
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
                <SidebarGroupLabel>
                  <Skeleton className="h-4 w-24" />
                </SidebarGroupLabel>
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
            <SidebarGroup key={props.title}>
              <SidebarGroupLabel>{props.title}</SidebarGroupLabel>
              <SidebarMenu>
                {props.items.map((item) => {
                  // Verificar se é CollapsibleItem (tem sub-items)
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
                                const isExternal =
                                  'type' in subItem &&
                                  subItem.type === E_MENU_ITEM_TYPE.EXTERNAL;

                                return (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={
                                        !isExternal &&
                                        location.pathname === subItem.url
                                      }
                                    >
                                      {isExternal ? (
                                        <a
                                          href={subItem.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={() => setOpenMobile(false)}
                                        >
                                          {subItem.icon && (
                                            <subItem.icon className="text-primary size-4" />
                                          )}
                                          <span>{subItem.title}</span>
                                        </a>
                                      ) : (
                                        <Link
                                          to={subItem.url}
                                          onClick={() => setOpenMobile(false)}
                                        >
                                          {subItem.icon && (
                                            <subItem.icon className="text-primary size-4" />
                                          )}
                                          <span>{subItem.title}</span>
                                        </Link>
                                      )}
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

                  // Item simples (LinkItem)
                  const to = String(item.url?.toString() ?? '/').replace(
                    /\/$/,
                    '',
                  );
                  const isExternal =
                    'type' in item && item.type === E_MENU_ITEM_TYPE.EXTERNAL;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className="group data-[active=true]:bg-primary data-[active=true]:text-primary-foreground "
                        isActive={!isExternal && location.pathname === to}
                        tooltip={item.title}
                      >
                        {isExternal ? (
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
                        ) : (
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
                              <Badge className="rounded-full px-1  text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
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
