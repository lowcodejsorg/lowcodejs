import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

import { TableSkeleton } from '@/components/common/table-views';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import {
  rowListOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';
import type { ISetting } from '@/lib/interfaces';
import { createRouteHead } from '@/lib/seo';
import { useAuthStore } from '@/stores/authentication';

const defaultSearch = { page: 1, perPage: 50 };

export const Route = createFileRoute('/_private/tables/$slug/')({
  beforeLoad: async ({ context, location }) => {
    const hasExplicitPerPage = location.searchStr.includes('perPage');
    if (!hasExplicitPerPage) {
      const settings = context.queryClient.getQueryData<ISetting>(
        queryKeys.settings.all,
      );
      if (settings && settings.PAGINATION_PER_PAGE !== 50) {
        const { redirect } = await import('@tanstack/react-router');
        throw redirect({
          search: (prev) => ({
            ...prev,
            perPage: settings.PAGINATION_PER_PAGE,
          }),
          replace: true,
        });
      }
    }
  },
  head: createRouteHead({ title: 'Tabela' }),
  pendingComponent: () => <TableSkeleton />,
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
  search: {
    middlewares: [stripSearchParams(defaultSearch)],
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) => {
    const isAuthenticated = Boolean(useAuthStore.getState().user);
    if (!isAuthenticated) return;

    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));
    context.queryClient.prefetchQuery(rowListOptions(params.slug, deps));
  },
});
