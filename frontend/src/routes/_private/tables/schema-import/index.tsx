import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_private/tables/schema-import/')({
  head: createRouteHead({
    title: 'Importar Schema',
    description: 'Crie múltiplas tabelas de uma vez usando um arquivo YAML',
  }),
});
