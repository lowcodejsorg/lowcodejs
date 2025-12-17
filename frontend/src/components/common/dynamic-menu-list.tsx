import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  ChevronRightIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LayoutListIcon,
  LoaderCircleIcon,
  PlusCircleIcon,
} from "lucide-react";

import { API } from "@/lib/api";
import { type Menu } from "@/lib/entity";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";

// Mapeamento de ícones por tipo de menu
const TYPE_ICONS: Record<string, LucideIcon> = {
  list: LayoutListIcon,
  page: FileTextIcon,
  form: PlusCircleIcon,
  external: ExternalLinkIcon,
};

// Tipo para menu com children
type MenuWithChildren = Menu & { children?: MenuWithChildren[] };

// Função para construir a árvore hierárquica de menus
function buildMenuTree(menus: Menu[]): MenuWithChildren[] {
  if (!menus || !Array.isArray(menus)) return [];

  const menuMap = new Map<string, MenuWithChildren>();
  const rootMenus: MenuWithChildren[] = [];

  // Primeiro, criar um mapa de todos os menus
  for (const menu of menus) {
    menuMap.set(menu._id, { ...menu, children: [] });
  }

  // Depois, construir a hierarquia

  for (const menu of menus) {
    const menuWithChildren = menuMap.get(menu._id)!;
    const parentId =
      typeof menu.parent === "string" ? menu.parent : menu.parent?._id;

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

// Componente para renderizar um item de menu dinâmico
function DynamicMenuItem({
  menu,
  location,
  setOpenMobile,
}: {
  menu: MenuWithChildren;
  location: ReturnType<typeof useLocation>;
  setOpenMobile: (open: boolean) => void;
}) {
  const Icon = TYPE_ICONS[menu.type] || LayoutListIcon;
  const url = menu.url || "#";
  const isExternal = menu.type !== "table";
  const hasChildren = menu.children && menu.children.length > 0;
  const isSeparator = menu.type === "separator";

  // Se tem filhos OU é separator, renderiza como collapsible
  if (hasChildren || isSeparator) {
    return (
      <Collapsible asChild className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={menu.name}>
              <Icon className="text-primary" width={32} />
              <span>{menu.name}</span>
              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {hasChildren ? (
                // Renderizar filhos existentes
                menu.children?.map((child) => {
                  const childUrl = child.url || "#";
                  const childIsExternal = child.type !== "table";
                  const ChildIcon = TYPE_ICONS[child.type] || LayoutListIcon;

                  if (childIsExternal) {
                    return (
                      <SidebarMenuSubItem key={child._id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location?.pathname?.includes(childUrl)}
                        >
                          <a
                            href={childUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpenMobile(false)}
                          >
                            <ChildIcon className="text-primary size-4" />
                            <span>{child.name}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  }

                  return (
                    <SidebarMenuSubItem key={child._id}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={location?.pathname?.includes(childUrl)}
                      >
                        <Link to={childUrl} onClick={() => setOpenMobile(false)}>
                          <ChildIcon className="text-primary size-4" />
                          <span>{child.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })
              ) : (
                // Placeholder para separator vazio
                <SidebarMenuSubItem>
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    Nenhum sub-item ainda
                  </div>
                </SidebarMenuSubItem>
              )}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  // Item simples sem filhos - Link externo
  if (isExternal) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
          tooltip={menu.name}
        >
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpenMobile(false)}
          >
            <Icon
              className="text-primary group-data-[active=true]:text-primary-foreground"
              width={32}
            />
            <span>{menu.name}</span>
            <ExternalLinkIcon className="ml-auto size-3 opacity-50" />
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Item simples sem filhos - Link interno
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
        isActive={location?.pathname?.includes(url)}
        tooltip={menu.name}
      >
        <Link to={url} onClick={() => setOpenMobile(false)}>
          <Icon
            className="text-primary group-data-[active=true]:text-primary-foreground"
            width={32}
          />
          <span>{menu.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

interface DynamicMenuListProps {
  setOpenMobile: (open: boolean) => void;
}

export function DynamicMenuList({ setOpenMobile }: DynamicMenuListProps) {
  const location = useLocation();

  // Buscar menus dinâmicos
  const menuList = useQuery({
    queryKey: ["/menu"],
    queryFn: async () => {
      const response = await API.get<Menu[]>("/menu");
      return response.data;
    },
  });

  // Normalizar os dados - pode ser array direto ou { data: [] }
  const menuData = useMemo(() => {
    if (!menuList.data) return [];

    if (Array.isArray(menuList.data)) return menuList.data;

    return [];
  }, [menuList.data]);

  // Construir árvore hierárquica dos menus dinâmicos
  const dynamicMenuTree = useMemo(() => {
    return buildMenuTree(menuData);
  }, [menuData]);

  // Se está carregando
  if (menuList.status === "pending") {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-muted-foreground text-xs flex items-center gap-1">
          <LoaderCircleIcon className="size-3 animate-spin" />
        </SidebarGroupLabel>
      </SidebarGroup>
    );
  }

  // Se não há menus para mostrar
  if (menuList.status === "success" && dynamicMenuTree.length === 0) {
    return null;
  }

  // Renderizar menus dinâmicos
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {dynamicMenuTree.map((menu) => (
          <DynamicMenuItem
            key={menu._id}
            menu={menu}
            location={location}
            setOpenMobile={setOpenMobile}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
