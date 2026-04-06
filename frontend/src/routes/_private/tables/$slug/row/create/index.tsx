import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { CreateRowSkeleton } from './-create-row-skeleton';

import { tableDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/tables/$slug/row/create/')({
  pendingComponent: CreateRowSkeleton,
  validateSearch: z.object({
    categoryId: z.string().optional(),
    categorySlug: z.string().optional(),
  }),
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));
  },
});
