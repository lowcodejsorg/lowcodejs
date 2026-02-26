import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import {
  rowListOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';
import { useAuthStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/tables/$slug/')({
  head: ({ matches }) => {
    const systemName =
      (matches[0]?.loaderData as { systemName?: string })?.systemName ||
      'LowCodeJs';
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
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const isAuthenticated = Boolean(useAuthStore.getState().user);
    if (!isAuthenticated) return; // componente trata via hooks

    await Promise.all([
      context.queryClient.ensureQueryData(tableDetailOptions(params.slug)),
      context.queryClient.ensureQueryData(rowListOptions(params.slug, deps)),
    ]);
  },
});
