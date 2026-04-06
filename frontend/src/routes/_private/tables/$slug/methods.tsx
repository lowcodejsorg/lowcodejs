import { createFileRoute } from '@tanstack/react-router';

import { tableDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/tables/$slug/methods')({
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));
  },
});
