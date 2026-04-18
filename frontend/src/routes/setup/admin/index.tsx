import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/setup/admin/')({
  head: createRouteHead({ title: 'Setup - Administrador' }),
});
