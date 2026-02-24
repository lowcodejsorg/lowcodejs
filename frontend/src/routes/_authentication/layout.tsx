import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { ROLE_DEFAULT_ROUTE } from '@/lib/menu/menu-access-permissions';

export const Route = createFileRoute('/_authentication')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') return; // SSR — skip
    const { useAuthStore } = await import('@/stores/authentication');
    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.user) {
      const role = state.user.group?.slug?.toUpperCase() ?? 'REGISTERED';
      throw redirect({ to: ROLE_DEFAULT_ROUTE[role] ?? '/tables' });
    }
  },
  component: () => <Outlet />,
});
