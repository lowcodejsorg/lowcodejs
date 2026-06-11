import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_private/notifications/')({
  head: createRouteHead({ title: 'Notificações' }),
});
