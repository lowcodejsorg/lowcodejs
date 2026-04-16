import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_setup/name')({
  head: createRouteHead({ title: 'Setup - Identidade' }),
});
