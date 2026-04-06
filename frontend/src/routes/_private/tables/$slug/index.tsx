import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import {
  rowListOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';
import { createRouteHead } from '@/lib/seo';
import { useAuthStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/tables/$slug/')({
  head: createRouteHead({ title: 'Tabela' }),
  validateSearch: z
    .object({
      page: z.coerce.number().default(1),
      perPage: z.coerce.number().default(50),
      trashed: z
        .preprocess(
          (v) => {
            if (typeof v === 'boolean') return String(v);
            return v;
          },
          z.enum(['true', 'false']).transform((v) => v === 'true'),
        )
        .optional(),
    })
    .catchall(
      z.union([z.enum(['asc', 'desc']).optional(), z.string().optional()]),
    ),
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) => {
    const isAuthenticated = Boolean(useAuthStore.getState().user);
    if (!isAuthenticated) return;

    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));
    context.queryClient.prefetchQuery(rowListOptions(params.slug, deps));
  },
});
