import {
  Sidebar as Root,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LoaderCircleIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  ShieldIcon,
  TableCellsMergeIcon,
  UsersIcon,
} from "lucide-react";

import { DynamicMenuList } from "@/components/common/dynamic-menu-list";
import { Logo } from "@/components/common/logo";
import { Logotipo } from "@/components/common/logotipo";
import { useAuthentication } from "@/hooks/authentication.hook";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import { cn, enabledMenu } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { toast } from "sonner";

export function Sidebar() {
  const { t } = useI18n();
  const { setOpenMobile, state } = useSidebar();
  const location = useLocation();
  const router = useRouter();

  const { signOut: _signOut, user } = useAuthentication();

  const signOut = useMutation({
    mutationFn: async function () {
      const route = "/authentication/sign-out";
      const response = await API.post(route);
      return response.data;
    },
    onSuccess() {
      _signOut();
      router.navigate({
        to: "/",
        replace: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t("LAYOUT_SIDEBAR_AUTH_REQUIRED_ERROR", "Authentication required")
          );
        }

        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  // Menu estático - Items do grupo "Menu"
  const menuItems = [
    {
      title: t("SIDEBAR_MENU_TABLE_LABEL", "Tables") as string,
      url: "/tables",
      icon: TableCellsMergeIcon,
    },
  ].filter((item) => {
    const url = item.url?.toString();

    if (!user?.group?.slug) {
      const allowedWhenNoUser = ["/dashboard", "/tables"];
      return allowedWhenNoUser.includes(url || "");
    }

    return enabledMenu(url, user?.group?.slug);
  });

  // Menu estático - Items do grupo "Settings"
  const settingsItems = [
    {
      title: t("SIDEBAR_MENU_CONFIGURATION_USER_LABEL", "Users") as string,
      url: "/users",
      icon: UsersIcon,
    },
    {
      title: t(
        "SIDEBAR_MENU_CONFIGURATION_USER_GROUP_LABEL",
        "User groups"
      ) as string,
      url: "/user-groups",
      icon: ShieldIcon,
    },
    {
      title: "Menu",
      url: "/menu-management",
      icon: MenuIcon,
    },
    {
      title: t("SIDEBAR_MENU_CONFIGURATION_SYSTEM_LABEL", "System") as string,
      url: "/settings",
      icon: SettingsIcon,
    },
  ].filter((item) => {
    const url = item.url?.toString();

    if (!user?.group?.slug) {
      return false;
    }

    return enabledMenu(url, user?.group?.slug);
  });

  return (
    <Root collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem
            className={cn(
              "inline-flex",
              state === "expanded" && "justify-center"
            )}
          >
            <Link to={"/tables"}>
              {state === "collapsed" && <Logotipo />}
              {state === "expanded" && <Logo />}
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Indicador quando user não está carregado */}
        {!user && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs flex items-center gap-1">
              <LoaderCircleIcon className="size-3 animate-spin" />
              {t("NAVIGATION_LOADING_PERMISSIONS", "Loading permissions...")}
            </SidebarGroupLabel>
          </SidebarGroup>
        )}

        {/* Menu estático principal (Tables, Gestão de menu) */}
        {menuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("SIDEBAR_MENU_HOME_LABEL", "Inicio")}
            </SidebarGroupLabel>
            <SidebarMenu>
              {menuItems.map((item) => {
                const to = String(item?.url?.toString() ?? "/").replace(
                  /\/$/,
                  ""
                );

                return (
                  <SidebarMenuItem key={item.title}>
                    <div className="relative group">
                      <SidebarMenuButton
                        asChild
                        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        isActive={location?.pathname?.includes(to)}
                        tooltip={item.title}
                      >
                        <Link to={to} onClick={() => setOpenMobile(false)}>
                          {item.icon && (
                            <item.icon
                              className="text-primary group-data-[active=true]:text-primary-foreground"
                              width={32}
                            />
                          )}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Menus dinâmicos da API - APÓS Gestão de menu */}
        <DynamicMenuList setOpenMobile={setOpenMobile} />

        {/* Settings */}
        {settingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("LAYOUT_SIDEBAR_SETTINGS_TITLE", "Settings")}
            </SidebarGroupLabel>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const to = String(item?.url?.toString() ?? "/").replace(
                  /\/$/,
                  ""
                );

                return (
                  <SidebarMenuItem key={item.title}>
                    <div className="relative group">
                      <SidebarMenuButton
                        asChild
                        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        isActive={location?.pathname?.includes(to)}
                        tooltip={item.title}
                      >
                        <Link to={to} onClick={() => setOpenMobile(false)}>
                          {item.icon && (
                            <item.icon
                              className="text-primary group-data-[active=true]:text-primary-foreground"
                              width={32}
                            />
                          )}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Logout */}
        <SidebarGroup>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => signOut.mutateAsync()}
                    className="w-full rounded-none cursor-pointer"
                  >
                    <LogOutIcon className="text-primary" />
                    <span>{t("SIDEBAR_MENU_LOGOUT_LABEL", "Logout")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </TooltipTrigger>
            {state === "collapsed" && (
              <TooltipContent side="right">
                {t("SIDEBAR_MENU_LOGOUT_LABEL", "Logout")}
              </TooltipContent>
            )}
          </Tooltip>
        </SidebarGroup>
      </SidebarContent>
    </Root>
  );
}
