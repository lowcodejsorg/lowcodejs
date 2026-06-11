import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/setup/paging/')({
  head: createRouteHead({ title: 'Setup - Paginação' }),
});
