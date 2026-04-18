import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/setup/storage/')({
  head: createRouteHead({ title: 'Setup - Armazenamento' }),
});
