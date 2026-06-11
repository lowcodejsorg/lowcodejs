import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/setup/email/')({
  head: createRouteHead({ title: 'Setup - Email' }),
});
