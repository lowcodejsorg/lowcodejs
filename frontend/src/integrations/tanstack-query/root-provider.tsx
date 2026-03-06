import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { QueryClient as queryClient } from '@/lib/query-client';

export function getContext(): {
  queryClient: QueryClient;
} {
  return { queryClient };
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
