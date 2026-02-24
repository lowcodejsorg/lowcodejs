/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import * as TanstackQuery from './integrations/tanstack-query/root-provider';
import { routeTree } from './routeTree.gen';

export interface RouterContext {
  queryClient: QueryClient;
}

export const getRouter = () => {
  const rqContext = TanstackQuery.getContext();
  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultStructuralSharing: true,
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider {...rqContext}>
          {props.children}
        </TanstackQuery.Provider>
      );
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: rqContext.queryClient,
  });

  return router;
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
