import { createFileRoute } from '@tanstack/react-router';

import { FieldManagementSkeleton } from '../../../field/-field-management-skeleton';

import { tableDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute(
  '/_private/tables/$slug/group/$groupSlug/field/management',
)({
  pendingComponent: FieldManagementSkeleton,
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));
  },
});
