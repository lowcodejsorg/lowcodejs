import { createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

import { resolveExistingMode } from './-row-mode';

import {
  rowDetailOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';
import type { IRow } from '@/lib/interfaces';
import { useAuthStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/tables/$slug/row/')({
  validateSearch: z.object({
    _id: z.string().optional(),
    mode: z.enum(['view', 'edit']).optional(),
    category: z.string().optional(),
  }),
  loaderDeps: ({ search }) => ({ _id: search._id, mode: search.mode }),
  loader: async ({ context, params, deps }): Promise<void> => {
    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));

    const user = useAuthStore.getState().user;
    if (!user || !deps._id) return;

    // Sobe a visualizacao por ?_id para a URL amigavel quando a tabela tem
    // campo de slug configurado e o registro ja possui sharedRowSlug. Assim
    // todos os links existentes (?_id) passam a exibir /tables/<slug>/<rowSlug>.
    // Edicao e rascunhos permanecem em ?_id.
    const table = await context.queryClient.ensureQueryData(
      tableDetailOptions(params.slug),
    );
    if (!table.rowSlugFieldId) return;

    let row: IRow | null = null;
    try {
      row = await context.queryClient.ensureQueryData(
        rowDetailOptions(params.slug, deps._id),
      );
    } catch {
      return; // o componente trata erro/acesso negado
    }

    const mode = resolveExistingMode(deps.mode, row, user._id);
    if (mode === 'view' && row.sharedRowSlug) {
      throw redirect({
        to: '/tables/$slug/$rowSlug',
        params: { slug: params.slug, rowSlug: row.sharedRowSlug },
        replace: true,
      });
    }
  },
});
