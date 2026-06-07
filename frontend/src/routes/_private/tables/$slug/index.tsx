import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

import { TableSkeleton } from '@/components/common/table-views';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import {
  rowListOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';
import { createRouteHead } from '@/lib/seo';
import { useAuthStore } from '@/stores/authentication';

const defaultSearch = { page: 1 };

export const Route = createFileRoute('/_private/tables/$slug/')({
  head: createRouteHead({ title: 'Tabela' }),
  pendingComponent: () => <TableSkeleton />,
  validateSearch: z
    .object({
      page: z.coerce.number().default(1),
      perPage: z.coerce.number().optional(),
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
  search: {
    middlewares: [stripSearchParams(defaultSearch)],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const isAuthenticated = Boolean(useAuthStore.getState().user);
    if (!isAuthenticated) return;

    const tableData = await context.queryClient.fetchQuery(
      tableDetailOptions(params.slug),
    );
    context.queryClient.prefetchQuery(
      rowListOptions(params.slug, deps, tableData.defaultPerPage),
    );
  },
});
