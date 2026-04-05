import { createFileRoute } from '@tanstack/react-router';

import { UpdateTableFormSkeleton } from './-update-form-skeleton';

import { tableDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/tables/$slug/detail/')({
  pendingComponent: UpdateTableFormSkeleton,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(tableDetailOptions(params.slug));
  },
});
