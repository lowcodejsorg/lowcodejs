import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { QueryClient as queryClient } from '@/lib/query-client';

export function Provider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
