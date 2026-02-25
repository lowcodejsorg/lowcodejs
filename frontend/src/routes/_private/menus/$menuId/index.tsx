import { createFileRoute } from '@tanstack/react-router';

import { UpdateMenuFormSkeleton } from './-update-form-skeleton';

import { menuDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/menus/$menuId/')({
  pendingComponent: UpdateMenuFormSkeleton,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(menuDetailOptions(params.menuId));
  },
});
