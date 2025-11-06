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
  SettingsIcon,
  ShieldIcon,
  TableCellsMergeIcon,
  UsersIcon,
} from "lucide-react";

// import Logo from "@/assets/laca-logo.webp";
import { Logo } from "@/components/custom/logo";
import { Logotipo } from "@/components/custom/logotipo";
import { Badge } from "@/components/ui/badge";
import { useAuthentication } from "@/hooks/authentication.hook";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { MenuRoute } from "@/lib/entity";
import { cn, enabledMenu } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { toast } from "sonner";

export function Sidebar() {
  const { t } = useI18n();
  const { setOpenMobile } = useSidebar();
  const location = useLocation();

  const MenuRouteMap: MenuRoute = [
    {
      title: "Menu",
      items: [
        // {
        //   title: t("SIDEBAR_MENU_HOME_LABEL", "Inicio") as string,
        //   url: "/dashboard",
        //   icon: HomeIcon,
        // },
        {
          title: t("SIDEBAR_MENU_TABLE_LABEL", "Tables") as string,
          url: "/tables",
          icon: TableCellsMergeIcon,
        },
      ],
    },

    {
      title: t("LAYOUT_SIDEBAR_SETTINGS_TITLE", "Settings") as string,
      items: [
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
          title: t(
            "SIDEBAR_MENU_CONFIGURATION_SYSTEM_LABEL",
            "System"
          ) as string,
          url: "/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ];

  const router = useRouter();

  const { state } = useSidebar();
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

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t("LAYOUT_SIDEBAR_AUTH_REQUIRED_ERROR", "Authentication required")
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  // ✅ OPÇÃO 3: Fallback nas permissões (MAIS ROBUSTA)
  const menu = MenuRouteMap?.map((menuGroup) => ({
    ...menuGroup,
    items: menuGroup.items?.filter((item) => {
      const url = item.url?.toString();

      // Se user é null, permitir apenas rotas essenciais
      if (!user?.group?.slug) {
        const allowedWhenNoUser = ["/dashboard", "/tables"];
        return allowedWhenNoUser.includes(url || "");
      }

      // User carregado, usar permissões normais
      return enabledMenu(url, user?.group?.slug);
    }),
  }))?.filter((menuGroup) => menuGroup.items && menuGroup.items.length > 0);

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
            {/* <Link to={"/dashboard"}>
              {state === "collapsed" && <Logotipo />}
              {state === "expanded" && <Logo />}
            </Link> */}
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

        {menu?.map((props) => (
          <SidebarGroup key={props.title}>
            <SidebarGroupLabel>{props.title}</SidebarGroupLabel>
            <SidebarMenu>
              {props.items.map((item) => {
                const to = String(item?.url?.toString() ?? "/").replace(
                  /\/$/,
                  ""
                );

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="group data-[active=true]:bg-primary data-[active=true]:text-primary-foreground "
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
                        {item.badge && (
                          <Badge className="rounded-full px-1  text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
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
