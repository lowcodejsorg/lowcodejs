import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_private/settings/')({
  beforeLoad: async () => {
    const { useAuthStore } = await import('@/stores/authentication');
    const role = useAuthStore.getState().user?.group?.slug?.toUpperCase();
    if (role !== 'MASTER') {
      const { redirect } = await import('@tanstack/react-router');
      throw redirect({ to: '/tables' });
    }
  },
  head: () => ({ meta: [{ title: 'Configurações - LowCodeJS' }] }),
});
