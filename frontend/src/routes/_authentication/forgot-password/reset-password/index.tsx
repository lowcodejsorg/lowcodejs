import { createFileRoute, redirect } from '@tanstack/react-router';

import { profileDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute(
  '/_authentication/forgot-password/reset-password/',
)({
  head: createRouteHead({ title: 'Redefinir Senha' }),
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData(
        profileDetailOptions(),
      );
      if (!user) {
        throw redirect({ to: '/forgot-password' });
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'to' in e) throw e;
      throw redirect({ to: '/forgot-password' });
    }
  },
});
