import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import {
  fieldDetailOptions,
  groupFieldDetailOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/tables/$slug/field/$fieldId/')({
  validateSearch: z.object({
    group: z.string().optional(),
  }),
  loaderDeps: ({ search }) => ({ group: search.group }),
  loader: async ({ context, params, deps }) => {
    const tablePromise = context.queryClient.ensureQueryData(
      tableDetailOptions(params.slug),
    );

    if (deps.group) {
      await Promise.all([
        tablePromise,
        context.queryClient.ensureQueryData(
          groupFieldDetailOptions(params.slug, deps.group, params.fieldId),
        ),
      ]);
    } else {
      await Promise.all([
        tablePromise,
        context.queryClient.ensureQueryData(
          fieldDetailOptions(params.slug, params.fieldId),
        ),
      ]);
    }
  },
});
