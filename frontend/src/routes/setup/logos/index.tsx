import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/setup/logos/')({
  head: createRouteHead({ title: 'Setup - Logos' }),
});
