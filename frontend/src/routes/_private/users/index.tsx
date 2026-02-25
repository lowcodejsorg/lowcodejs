import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

import { TableUsersSkeleton } from './-table-users-skeleton';

import { userListOptions } from '@/hooks/tanstack-query/_query-options';

const defaultSearch = { page: 1, perPage: 50 };
const headers = ['Nome', 'E-mail', 'Papel', 'Status'];

export const Route = createFileRoute('/_private/users/')({
  beforeLoad: async () => {
    const { useAuthStore } = await import('@/stores/authentication');
    const role = useAuthStore.getState().user?.group?.slug?.toUpperCase();
    if (!['MASTER', 'ADMINISTRATOR'].includes(role ?? '')) {
      const { redirect } = await import('@tanstack/react-router');
      throw redirect({ to: '/tables' });
    }
  },
  head: ({ matches }) => {
    const systemName =
      (matches[0]?.loaderData as { systemName?: string })?.systemName ||
      'LowCodeJs';
    return { meta: [{ title: `Usuarios - ${systemName}` }] };
  },
  pendingComponent: () => <TableUsersSkeleton headers={headers} />,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
  search: {
    middlewares: [stripSearchParams(defaultSearch)],
  },
  loaderDeps: ({ search }) => ({
    page: search.page,
    perPage: search.perPage,
    search: search.search,
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(userListOptions(deps));
  },
});
