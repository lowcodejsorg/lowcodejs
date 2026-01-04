import { Outlet, createFileRoute } from '@tanstack/react-router';
import React from 'react';

import { Header } from '@/components/common/header';
import { Sidebar } from '@/components/common/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useMenuDynamic } from '@/hooks/tanstack-query/use-menu-dynamic';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const authentication = useAuthenticationStore().authenticated;

  const routesWithoutSearchInput: Array<string | RegExp> = [
    '/',
    '/dashboard',
    /^\/groups\/.+$/,
    '/groups/create',
    /^\/menus\/.+$/,
    '/menus/create',
    /^\/pages\/.+$/,
    '/profile',
    '/settings',
    /^\/tables\/[^/]+\/field\/.+$/,
    /^\/tables\/[^/]+\/field\/create$/,
    /^\/tables\/[^/]+\/row\/.+$/,
    /^\/tables\/[^/]+\/row\/create$/,
    /^\/tables\/[^/]+\/detail$/,
    /^\/tables\/[^/]+\/methods$/,
    /^\/users\/.+$/,
    '/users/create',
  ];

  return (
    <SidebarProvider>
      {authentication?.role && (
        <Sidebar menu={useMenuDynamic(authentication.role).menu} />
      )}
      {!authentication?.role && (
        <Sidebar menu={useMenuDynamic('REGISTERED').menu} />
      )}
      <SidebarInset className="relative flex flex-col h-screen w-screen overflow-hidden flex-1 px-4 sm:px-2">
        <Header routesWithoutSearchInput={routesWithoutSearchInput} />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
