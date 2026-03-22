import { createFileRoute } from '@tanstack/react-router';

import { tableDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/tables/$slug/field/management')(
  {
    loader: async ({ context, params }) => {
      await context.queryClient.ensureQueryData(
        tableDetailOptions(params.slug),
      );
    },
  },
);
