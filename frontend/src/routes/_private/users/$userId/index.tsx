import { createFileRoute } from '@tanstack/react-router';

import { UpdateUserFormSkeleton } from './-update-form-skeleton';

import { userDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/users/$userId/')({
  pendingComponent: UpdateUserFormSkeleton,
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(userDetailOptions(params.userId));
  },
});
