import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { rowBySlugOptions } from '@/hooks/tanstack-query/_query-options';

// Segmentos estaticos irmaos sob $slug (row, detail, field, methods) tem
// precedencia sobre este segmento dinamico, mas guardamos por seguranca para
// nunca tratar uma rota reservada como slug de registro.
const RESERVED_SEGMENTS = new Set(['row', 'detail', 'field', 'methods']);

export const Route = createFileRoute('/_private/tables/$slug/$rowSlug/')({
  loader: async ({ context, params }) => {
    if (RESERVED_SEGMENTS.has(params.rowSlug)) throw notFound();

    // Backend resolve o slug amigavel -> registro; aqui o frontend decide a
    // navegacao (abre a pagina do registro por _id). Mantem a rota /row?_id=
    // intacta e permite frontends customizados trocarem este comportamento.
    const row = await context.queryClient.ensureQueryData(
      rowBySlugOptions(params.slug, params.rowSlug),
    );

    throw redirect({
      to: '/tables/$slug/row',
      params: { slug: params.slug },
      search: { _id: row._id, mode: 'view' },
    });
  },
});
