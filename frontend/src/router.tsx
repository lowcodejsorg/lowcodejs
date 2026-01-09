/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import * as TanstackQuery from './integrations/tanstack-query/root-provider';
// Import the generated route tree
import { routeTree } from './routeTree.gen';

import { RootProvider as FumadocsRootProvider } from 'fumadocs-ui/provider/tanstack'

// Create a new router instance
export const getRouter = () => {
  const rqContext = TanstackQuery.getContext();

  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: 'intent',
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider {...rqContext}>
          <FumadocsRootProvider 
          theme={{ defaultTheme: 'light', enableSystem: false }}
          search={{ enabled: false }}
          
          >
            {props.children}
          </FumadocsRootProvider>
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
