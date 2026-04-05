import { createFileRoute } from '@tanstack/react-router';

import { DashboardSkeleton } from './-dashboard-skeleton';

import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_private/dashboard/')({
  head: createRouteHead({ title: 'Dashboard' }),
  pendingComponent: DashboardSkeleton,
});
