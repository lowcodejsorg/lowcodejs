import { createFileRoute } from '@tanstack/react-router';

import { extensionActiveListOptions } from '@/hooks/tanstack-query/use-extensions-active-list';
import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_private/tools/')({
  head: createRouteHead({ title: 'Ferramentas' }),
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(extensionActiveListOptions());
  },
});
