import { createFileRoute } from '@tanstack/react-router';

import { UpdateProfileFormSkeleton } from './-update-form-skeleton';

import { profileDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/profile/')({
  head: ({ matches }) => {
    const systemName =
      (matches[0]?.loaderData as { systemName?: string })?.systemName ||
      'LowCodeJs';
    return { meta: [{ title: `Perfil - ${systemName}` }] };
  },
  pendingComponent: UpdateProfileFormSkeleton,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(profileDetailOptions());
  },
});
