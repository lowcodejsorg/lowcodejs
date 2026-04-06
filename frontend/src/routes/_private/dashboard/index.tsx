import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_private/dashboard/')({
  head: createRouteHead({ title: 'Dashboard' }),
});
