import { createFileRoute } from '@tanstack/react-router';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_authentication/_sign-in/')({
  head: createRouteHead({ title: 'Login' }),
});
