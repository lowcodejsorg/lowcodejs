import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: true,
        staleTime: 60 * 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getContext(): {
  queryClient: QueryClient;
} {
  if (typeof window === 'undefined') {
    return { queryClient: makeQueryClient() };
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return { queryClient: browserQueryClient };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
