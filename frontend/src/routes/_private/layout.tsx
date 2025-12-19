import type { LinkProps } from '@tanstack/react-router';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import React from 'react';

// import { Header } from '@/components/common/header';
// import { Sidebar } from '@/components/common/sidebar';
import { Header } from '@/components/common/header';
import { Sidebar } from '@/components/common/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getCurrentAuthenticatedServerFn } from '@/functions/authentication';
import { useMenuDynamic } from '@/hooks/use-menu-dynamic';
import {
  canAccessRoute,
  ROLE_DEFAULT_ROUTE,
} from '@/lib/menu/menu-access-permissions';

export const Route = createFileRoute('/_private')({
  component: RouteComponent,
  loader: async ({ location }) => {
    const response = await getCurrentAuthenticatedServerFn();

    if (!response.authenticated) {
      throw redirect({ to: '/' }); // Redireciona para login
    }

    console.log({
      canAccessRoute: canAccessRoute(response.role, location.pathname),
    });

    // Verifica se pode acessar a rota atual
    if (!canAccessRoute(response.role, location.pathname)) {
      const route = ROLE_DEFAULT_ROUTE[response.role];
      throw redirect({ to: route });
    }

    return response;
  },
});

function RouteComponent(): React.JSX.Element {
  const loader = Route.useLoaderData();

  const { menu } = useMenuDynamic(loader.role);

  const routesWithoutSearchInput: Array<LinkProps['to']> = ['/'];

  return (
    <SidebarProvider>
      <Sidebar menu={menu} />
      <SidebarInset className="relative flex flex-col h-screen w-screen overflow-hidden flex-1 px-4 sm:px-2">
        <Header routesWithoutSearchInput={routesWithoutSearchInput} />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
