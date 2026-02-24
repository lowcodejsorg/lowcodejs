import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

export const Route = createFileRoute('/_private/tables/$slug/')({
  head: ({ matches }) => {
    const systemName = (matches[0]?.loaderData as { systemName?: string })?.systemName || 'LowCodeJs';
    return { meta: [{ title: `Tabela - ${systemName}` }] };
  },
  validateSearch: z
    .object({
      page: z.coerce.number().default(1),
      perPage: z.coerce.number().default(50),
      trashed: z.coerce.boolean().optional(),
    })
    .catchall(
      z.union([z.enum(['asc', 'desc']).optional(), z.string().optional()]),
    ),
});
