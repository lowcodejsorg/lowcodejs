import { createFileRoute } from '@tanstack/react-router';

import { UpdateSettingFormSkeleton } from './-update-form-skeleton';

import { settingOptions } from '@/hooks/tanstack-query/_query-options';
import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_private/settings/')({
  beforeLoad: async () => {
    const { useAuthStore } = await import('@/stores/authentication');
    const userGroups = useAuthStore.getState().user?.groups ?? [];
    const role = userGroups[0]?.slug?.toUpperCase();
    if (role !== 'MASTER') {
      const { redirect } = await import('@tanstack/react-router');
      throw redirect({ to: '/tables' });
    }
  },
  head: createRouteHead({ title: 'Configurações' }),
  pendingComponent: UpdateSettingFormSkeleton,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(settingOptions());
  },
});
