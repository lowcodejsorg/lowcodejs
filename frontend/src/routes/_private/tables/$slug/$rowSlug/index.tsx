import { createFileRoute, notFound } from '@tanstack/react-router';

import {
  rowBySlugOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';

// Segmentos estaticos irmaos sob $slug (row, detail, field, methods, group) tem
// precedencia sobre este segmento dinamico, mas guardamos por seguranca para
// nunca tratar uma rota reservada como slug de registro.
const RESERVED_SEGMENTS = new Set([
  'row',
  'detail',
  'field',
  'methods',
  'group',
]);

export const Route = createFileRoute('/_private/tables/$slug/$rowSlug/')({
  loader: ({ context, params }): void => {
    if (RESERVED_SEGMENTS.has(params.rowSlug)) throw notFound();

    // Resolve o slug amigavel -> registro (popula o cache usado pela pagina).
    // O componente renderiza o detalhe NA propria URL amigavel (sem redirect),
    // mantendo /tables/<slug>/<rowSlug> na barra de endereco.
    context.queryClient.prefetchQuery(tableDetailOptions(params.slug));
    context.queryClient.prefetchQuery(
      rowBySlugOptions(params.slug, params.rowSlug),
    );
  },
});
