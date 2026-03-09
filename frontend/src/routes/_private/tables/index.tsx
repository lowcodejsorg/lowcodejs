import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

import { TableTablesSkeleton } from './-table-tables-skeleton';

import { tableListOptions } from '@/hooks/tanstack-query/_query-options';

const defaultSearch = { page: 1, perPage: 50 };

export const Route = createFileRoute('/_private/tables/')({
  pendingComponent: () => <TableTablesSkeleton />,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    name: z.string().optional(),
    trashed: z.coerce.boolean().optional(),
    visibility: z.string().optional(),
    owner: z.string().optional(),
    'order-name': z.enum(['asc', 'desc']).optional(),
    'order-link': z.enum(['asc', 'desc']).optional(),
    'order-created-at': z.enum(['asc', 'desc']).optional(),
    'order-visibility': z.enum(['asc', 'desc']).optional(),
    'order-owner': z.enum(['asc', 'desc']).optional(),
  }),
  search: {
    middlewares: [stripSearchParams(defaultSearch)],
  },
  loaderDeps: ({ search }) => ({
    page: search.page,
    perPage: search.perPage,
    search: search.search,
    name: search.name,
    trashed: search.trashed,
    visibility: search.visibility,
    owner: search.owner,
    'order-name': search['order-name'],
    'order-link': search['order-link'],
    'order-created-at': search['order-created-at'],
    'order-visibility': search['order-visibility'],
    'order-owner': search['order-owner'],
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(tableListOptions(deps));
  },
});
