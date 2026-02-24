import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { Toaster } from 'sonner';

import { RouteError } from '@/components/common/route-error';
import { RouteNotFound } from '@/components/common/route-not-found';
import RoutePending from '@/components/common/route-pending';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { RouterContext } from '@/router';
import { useAuthStore } from '@/stores/authentication';
import appCss from '@/styles.css?url';

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const state = useAuthStore.getState();

    if (!state.isAuthenticated && state.isLoading) {
      await state.fetchUser();
    }
  },
  component: RootDocument,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'LowCodeJs' },
      {
        name: 'description',
        content: 'Plataforma Oficial',
      },
      {
        property: 'og:title',
        content: 'LowCodeJs',
      },
      {
        property: 'og:description',
        content: 'Plataforma Oficial',
      },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>",
      },
    ],
  }),
});

function RootDocument(): React.JSX.Element {
  return (
    <html lang="pt-br">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <TooltipProvider>
          <Outlet />
          <Toaster />
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  );
}
