import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { tableDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/tables/$slug/field/management')(
  {
    validateSearch: z.object({
      group: z.string().optional(),
    }),
    loader: async ({ context, params }) => {
      await context.queryClient.ensureQueryData(
        tableDetailOptions(params.slug),
      );
    },
  },
);
