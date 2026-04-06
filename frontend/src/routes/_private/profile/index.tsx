import { createFileRoute } from '@tanstack/react-router';

import { UpdateProfileFormSkeleton } from './-update-form-skeleton';

import { profileDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { createRouteHead } from '@/lib/seo';

export const Route = createFileRoute('/_private/profile/')({
  head: createRouteHead({ title: 'Perfil' }),
  pendingComponent: UpdateProfileFormSkeleton,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(profileDetailOptions());
  },
});
