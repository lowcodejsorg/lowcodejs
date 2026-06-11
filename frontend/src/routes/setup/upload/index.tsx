import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/setup/upload/')({
  head: createRouteHead({ title: 'Setup - Upload' }),
});
