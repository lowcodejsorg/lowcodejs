import { createFileRoute } from '@tanstack/react-router';

import { extensionActiveListOptions } from '@/hooks/tanstack-query/use-extensions-active-list';
import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_private/e/$package/$id/')({
  head: createRouteHead({ title: 'Módulo' }),
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(extensionActiveListOptions());
  },
});
