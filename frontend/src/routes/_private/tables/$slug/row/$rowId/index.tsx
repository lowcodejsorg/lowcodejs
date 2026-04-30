import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { UpdateRowFormSkeleton } from './-update-form-skeleton';

import {
  rowDetailOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';
import { useAuthStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/tables/$slug/row/$rowId/')({
  pendingComponent: UpdateRowFormSkeleton,
  validateSearch: z.object({
    mode: z.enum(['edit']).optional(),
  }),
  loader: ({ context, params }) => {
    const isAuthenticated = Boolean(useAuthStore.getState().user);
    if (!isAuthenticated) return;

    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));
    context.queryClient.prefetchQuery(
      rowDetailOptions(params.slug, params.rowId),
    );
  },
});
