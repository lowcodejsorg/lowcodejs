import { createFileRoute } from '@tanstack/react-router';

import { extensionListOptions } from '@/hooks/tanstack-query/_query-options';
import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_private/tools/$package/$id/')({
  head: createRouteHead({ title: 'Ferramenta' }),
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(extensionListOptions());
  },
});
