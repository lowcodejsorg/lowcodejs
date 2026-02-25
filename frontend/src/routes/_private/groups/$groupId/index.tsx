import { createFileRoute } from '@tanstack/react-router';

import { UpdateGroupFormSkeleton } from './-update-form-skeleton';

import { groupDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/groups/$groupId/')({
  pendingComponent: UpdateGroupFormSkeleton,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      groupDetailOptions(params.groupId),
    );
  },
});
