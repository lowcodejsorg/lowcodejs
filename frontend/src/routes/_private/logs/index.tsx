import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

import { DataTableSkeleton } from '@/components/common/data-table';
import { createRouteHead } from '@/lib/seo';

const defaultSearch = { page: 1, perPage: 10 };

export const Route = createFileRoute('/_private/logs/')({
  head: createRouteHead({ title: 'Histórico de ações' }),
  pendingComponent: () => (
    <DataTableSkeleton
      headers={[
        'Data',
        'Usuário',
        'Ação',
        'Tipo de objeto',
        'ID do objeto',
        'URL',
      ]}
    >
      <DataTableSkeleton.Cell width="w-40" />
      <DataTableSkeleton.Cell width="w-32" />
      <DataTableSkeleton.Cell
        width="w-24"
        height="h-6"
        rounded="rounded-full"
      />
      <DataTableSkeleton.Cell
        width="w-20"
        height="h-6"
        rounded="rounded-full"
      />
      <DataTableSkeleton.Cell width="w-32" />
      <DataTableSkeleton.Cell width="w-56" />
      <DataTableSkeleton.ActionCell />
    </DataTableSkeleton>
  ),
  validateSearch: z.object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(10),
    search: z.string().optional(),
    actions: z.string().optional(),
    objects: z.string().optional(),
    'date-from': z.string().optional(),
    'date-to': z.string().optional(),
    'order-created-at': z.enum(['asc', 'desc']).optional(),
    'order-user': z.enum(['asc', 'desc']).optional(),
    'order-action': z.enum(['asc', 'desc']).optional(),
    'order-object': z.enum(['asc', 'desc']).optional(),
    'order-object-id': z.enum(['asc', 'desc']).optional(),
    'order-url': z.enum(['asc', 'desc']).optional(),
  }),
  search: {
    middlewares: [stripSearchParams(defaultSearch)],
  },
});
