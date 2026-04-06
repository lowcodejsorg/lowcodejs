import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

import { DataTableSkeleton } from '@/components/common/data-table';
import { userListOptions } from '@/hooks/tanstack-query/_query-options';
import { createRouteHead } from '@/lib/seo';
import { useAuthStore } from '@/stores/authentication';

const defaultSearch = { page: 1, perPage: 50 };

export const Route = createFileRoute('/_private/users/')({
  beforeLoad: async () => {
    const { useAuthStore } = await import('@/stores/authentication');
    const role = useAuthStore.getState().user?.group?.slug?.toUpperCase();
    if (!['MASTER', 'ADMINISTRATOR'].includes(role ?? '')) {
      const { redirect } = await import('@tanstack/react-router');
      throw redirect({ to: '/tables' });
    }
  },
  head: createRouteHead({ title: 'Usuários' }),
  pendingComponent: () => (
    <DataTableSkeleton headers={['Nome', 'E-mail', 'Papel', 'Status']}>
      <DataTableSkeleton.Cell width="w-45" />
      <DataTableSkeleton.Cell width="w-50" />
      <DataTableSkeleton.Cell width="w-25" />
      <DataTableSkeleton.Cell
        width="w-20"
        height="h-6"
        rounded="rounded-full"
      />
      <DataTableSkeleton.ActionCell />
    </DataTableSkeleton>
  ),
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    'order-name': z.enum(['asc', 'desc']).optional(),
    'order-email': z.enum(['asc', 'desc']).optional(),
    'order-group': z.enum(['asc', 'desc']).optional(),
    'order-status': z.enum(['asc', 'desc']).optional(),
    'order-created-at': z.enum(['asc', 'desc']).optional(),
  }),
  search: {
    middlewares: [stripSearchParams(defaultSearch)],
  },
  loaderDeps: ({ search }) => ({
    page: search.page,
    perPage: search.perPage,
    search: search.search,
    'order-name': search['order-name'],
    'order-email': search['order-email'],
    'order-group': search['order-group'],
    'order-status': search['order-status'],
    'order-created-at': search['order-created-at'],
  }),
  loader: ({ context, deps }) => {
    const authenticated = useAuthStore.getState().user?._id;
    context.queryClient.prefetchQuery(
      userListOptions({ ...deps, authenticated }),
    );
  },
});
