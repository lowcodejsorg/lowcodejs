import { createFileRoute } from '@tanstack/react-router';

import RoutePending from '@/components/common/route-pending';
import { pageDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/pages/$slug')({
  pendingComponent: RoutePending,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(pageDetailOptions(params.slug));
  },
});
