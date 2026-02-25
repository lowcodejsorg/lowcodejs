import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type * as React from 'react';
import { Toaster } from 'sonner';

import { RouteError } from '@/components/common/route-error';
import { RouteNotFound } from '@/components/common/route-not-found';
import RoutePending from '@/components/common/route-pending';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getApiBaseUrl } from '@/lib/get-api-config';
import type { RouterContext } from '@/router';
import appCss from '@/styles.css?url';

const getSystemName = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { Env } = await import('@/env');
    const baseUrl = Env.VITE_API_BASE_URL;
    const response = await fetch(`${baseUrl}/setting`);
    if (response.ok) {
      const data = await response.json();
      return data.SYSTEM_NAME || 'LowCodeJs';
    }
    return 'LowCodeJs';
  } catch {
    return 'LowCodeJs';
  }
});

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: async () => {
    const [baseUrl, systemName] = await Promise.all([
      getApiBaseUrl(),
      getSystemName(),
    ]);
    return { baseUrl, systemName };
  },
  component: RootDocument,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: ({ loaderData }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: loaderData?.systemName || 'LowCodeJs' },
      {
        name: 'description',
        content: 'Plataforma Oficial',
      },
      {
        property: 'og:title',
        content: loaderData?.systemName || 'LowCodeJs',
      },
      {
        property: 'og:description',
        content: 'Plataforma Oficial',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: loaderData?.baseUrl ?? '' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        type: 'image/webp',
        href: `${loaderData?.baseUrl}/storage/logo-small.webp`,
      },
      { rel: 'canonical', href: loaderData?.baseUrl ?? '' },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: loaderData?.systemName ?? 'LowCodeJs',
          url: loaderData?.baseUrl ?? '',
        }),
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
