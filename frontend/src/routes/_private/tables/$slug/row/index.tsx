import { createFileRoute } from '@tanstack/react-router';

import { tableDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { useAuthStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/tables/$slug/row/')({
  loader: ({ context, params }): void => {
    const isAuthenticated = Boolean(useAuthStore.getState().user);
    if (!isAuthenticated) return;

    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));
  },
});
