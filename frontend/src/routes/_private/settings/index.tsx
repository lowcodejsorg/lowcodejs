import { createFileRoute } from '@tanstack/react-router';

import { UpdateSettingFormSkeleton } from './-update-form-skeleton';

import { settingOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/settings/')({
  beforeLoad: async () => {
    const { useAuthStore } = await import('@/stores/authentication');
    const role = useAuthStore.getState().user?.group?.slug?.toUpperCase();
    if (role !== 'MASTER') {
      const { redirect } = await import('@tanstack/react-router');
      throw redirect({ to: '/tables' });
    }
  },
  head: ({ matches }) => {
    const systemName =
      (matches[0]?.loaderData as { systemName?: string })?.systemName ||
      'LowCodeJs';
    return { meta: [{ title: `Configurações - ${systemName}` }] };
  },
  pendingComponent: UpdateSettingFormSkeleton,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(settingOptions());
  },
});
