import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

export const Route = createFileRoute('/_private/menus/')({
  beforeLoad: async () => {
    const { useAuthStore } = await import('@/stores/authentication');
    const role = useAuthStore.getState().user?.group?.slug?.toUpperCase();
    if (!['MASTER', 'ADMINISTRATOR'].includes(role ?? '')) {
      const { redirect } = await import('@tanstack/react-router');
      throw redirect({ to: '/tables' });
    }
  },
  head: () => ({ meta: [{ title: 'Menus - LowCodeJS' }] }),
  validateSearch: z.object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});
