import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { tableDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { useAuthStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/tables/$slug/row/')({
  validateSearch: z.object({
    _id: z.string().optional(),
    mode: z.enum(['view', 'edit']).optional(),
    category: z.string().optional(),
  }),
  loader: ({ context, params }): void => {
    const isAuthenticated = Boolean(useAuthStore.getState().user);
    if (!isAuthenticated) return;

    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));
  },
});
