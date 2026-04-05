import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

import { DataTableSkeleton } from '@/components/common/data-table';
import { menuListOptions } from '@/hooks/tanstack-query/_query-options';
import { createRouteHead } from '@/lib/seo';

const defaultSearch = { page: 1, perPage: 50 };

export const Route = createFileRoute('/_private/menus/')({
  beforeLoad: async () => {
    const { useAuthStore } = await import('@/stores/authentication');
    const role = useAuthStore.getState().user?.group?.slug?.toUpperCase();
    if (!['MASTER', 'ADMINISTRATOR'].includes(role ?? '')) {
      const { redirect } = await import('@tanstack/react-router');
      throw redirect({ to: '/tables' });
    }
  },
  head: createRouteHead({ title: 'Menus' }),
  pendingComponent: () => (
    <DataTableSkeleton
      headers={['Nome', 'Slug', 'Tipo', 'Criado por', 'Criado em']}
    >
      <DataTableSkeleton.Cell width="w-40" />
      <DataTableSkeleton.Cell width="w-35" />
      <DataTableSkeleton.Cell
        width="w-24"
        height="h-6"
        rounded="rounded-full"
      />
      <DataTableSkeleton.Cell width="w-28" />
      <DataTableSkeleton.Cell width="w-36" />
      <DataTableSkeleton.ActionCell />
    </DataTableSkeleton>
  ),
  validateSearch: z.object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    search: z.string().optional(),
    trashed: z
      .preprocess(
        (v) => {
          if (typeof v === 'boolean') return String(v);
          return v;
        },
        z.enum(['true', 'false']).transform((v) => v === 'true'),
      )
      .optional(),
    'order-name': z.enum(['asc', 'desc']).optional(),
    'order-slug': z.enum(['asc', 'desc']).optional(),
    'order-type': z.enum(['asc', 'desc']).optional(),
    'order-created-at': z.enum(['asc', 'desc']).optional(),
    'order-owner': z.enum(['asc', 'desc']).optional(),
  }),
  search: {
    middlewares: [stripSearchParams(defaultSearch)],
  },
  loaderDeps: ({ search }) => ({
    page: search.page,
    perPage: search.perPage,
    search: search.search,
    trashed: search.trashed,
    'order-name': search['order-name'],
    'order-slug': search['order-slug'],
    'order-type': search['order-type'],
    'order-created-at': search['order-created-at'],
    'order-owner': search['order-owner'],
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(menuListOptions(deps));
  },
});
