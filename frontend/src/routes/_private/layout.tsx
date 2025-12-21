import type { LinkProps } from '@tanstack/react-router';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import React from 'react';

import { Header } from '@/components/common/header';
import { Sidebar } from '@/components/common/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useMenuDynamic } from '@/hooks/use-menu-dynamic';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const authentication = useAuthenticationStore().authenticated;

  console.log('authentication', authentication);

  // if (!authentication) return <Navigate to="/" />;

  const { menu } = useMenuDynamic(authentication!.role);

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
