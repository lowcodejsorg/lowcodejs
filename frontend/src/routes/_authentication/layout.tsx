import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { profileDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { ROLE_DEFAULT_ROUTE } from '@/lib/menu/menu-access-permissions';

export const Route = createFileRoute('/_authentication')({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData(
        profileDetailOptions(),
      );
      if (user) {
        const role = user.group?.slug?.toUpperCase() ?? 'REGISTERED';
        throw redirect({ to: ROLE_DEFAULT_ROUTE[role] ?? '/tables' });
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'to' in e) throw e;
    }
  },
  component: () => (
    <div data-test-id="auth-layout">
      <Outlet />
    </div>
  ),
});
