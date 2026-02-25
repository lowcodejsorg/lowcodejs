import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

import { TableTablesSkeleton } from './-table-tables-skeleton';

import { tableListOptions } from '@/hooks/tanstack-query/_query-options';

const defaultSearch = { page: 1, perPage: 50 };
const headers = [
  'Tabela',
  'Link (slug)',
  'Visibilidade',
  'Criado por',
  'Criado em',
];

export const Route = createFileRoute('/_private/tables/')({
  pendingComponent: () => <TableTablesSkeleton headers={headers} />,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    name: z.string().optional(),
    trashed: z.coerce.boolean().optional(),
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
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(tableListOptions(deps));
  },
});
