import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { FieldDetailSkeleton } from './-field-detail-skeleton';

import {
  fieldDetailOptions,
  groupFieldDetailOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/tables/$slug/field/$fieldId/')({
  pendingComponent: FieldDetailSkeleton,
  validateSearch: z.object({
    group: z.string().optional(),
  }),
  loaderDeps: ({ search }) => ({ group: search.group }),
  loader: ({ context, params, deps }) => {
    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));
    if (deps.group) {
      context.queryClient.prefetchQuery(
        groupFieldDetailOptions(params.slug, deps.group, params.fieldId),
      );
    } else {
      context.queryClient.prefetchQuery(
        fieldDetailOptions(params.slug, params.fieldId),
      );
    }
  },
});
