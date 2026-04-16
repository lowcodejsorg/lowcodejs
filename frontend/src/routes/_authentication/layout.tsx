import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import {
  profileDetailOptions,
  setupStatusOptions,
} from '@/hooks/tanstack-query/_query-options';
import { ROLE_DEFAULT_ROUTE } from '@/lib/menu/menu-access-permissions';

export const Route = createFileRoute('/_authentication')({
  beforeLoad: async ({ context, location }) => {
    const isResetPassword =
      location.pathname === '/forgot-password/reset-password';

    if (isResetPassword) return;

    const setupStatus =
      await context.queryClient.fetchQuery(setupStatusOptions());

    if (!setupStatus.completed) {
      const isSignUp = location.pathname === '/sign-up';
      if (isSignUp) {
        throw redirect({ to: '/setup/admin' });
      }

      const isSignIn = location.pathname === '/' || location.pathname === '';
      if (isSignIn && setupStatus.currentStep === 'admin') {
        throw redirect({ to: '/setup/admin' });
      }
    }

    try {
      const user = await context.queryClient.ensureQueryData(
        profileDetailOptions(),
      );
      if (user) {
        if (!setupStatus.completed && setupStatus.currentStep) {
          throw redirect({
            to: `/setup/${setupStatus.currentStep}`,
          });
        }
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
