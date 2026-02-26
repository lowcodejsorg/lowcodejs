import { createFileRoute } from '@tanstack/react-router';

import { UpdateRowFormSkeleton } from './-update-form-skeleton';

import {
  rowDetailOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';
import { useAuthStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/tables/$slug/row/$rowId/')({
  pendingComponent: UpdateRowFormSkeleton,
  loader: async ({ context, params }) => {
    const isAuthenticated = Boolean(useAuthStore.getState().user);
    if (!isAuthenticated) return;

    await Promise.all([
      context.queryClient.ensureQueryData(tableDetailOptions(params.slug)),
      context.queryClient.ensureQueryData(
        rowDetailOptions(params.slug, params.rowId),
      ),
    ]);
  },
});
