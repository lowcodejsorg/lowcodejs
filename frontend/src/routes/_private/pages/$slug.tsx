import { createFileRoute } from '@tanstack/react-router';

import { PageSkeleton } from './-page-skeleton';

import { pageDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/pages/$slug')({
  pendingComponent: PageSkeleton,
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(pageDetailOptions(params.slug));
  },
});
