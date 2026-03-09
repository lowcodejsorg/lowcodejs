import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

import { TableMenusSkeleton } from './-table-menus-skeleton';

import { menuListOptions } from '@/hooks/tanstack-query/_query-options';
import { createRouteHead } from '@/lib/seo';

const defaultSearch = { page: 1, perPage: 50 };
const headers = ['Nome', 'Slug', 'Tipo', 'Criado por', 'Criado em'];

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
  pendingComponent: () => <TableMenusSkeleton headers={headers} />,
  validateSearch: z.object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    search: z.string().optional(),
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
