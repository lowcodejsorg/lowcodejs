import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import {
  fieldDetailOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/tables/$slug/field/$fieldId/')({
  validateSearch: z.object({
    group: z.string().optional(),
  }),
  loaderDeps: ({ search }) => ({ group: search.group }),
  loader: async ({ context, params, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(tableDetailOptions(params.slug)),
      context.queryClient.ensureQueryData(
        fieldDetailOptions(params.slug, params.fieldId, deps.group),
      ),
    ]);
  },
});
