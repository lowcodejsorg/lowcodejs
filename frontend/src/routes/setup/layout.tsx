import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import type * as React from 'react';
import { z } from 'zod';

import { BlockedDialog } from './-blocked-dialog';

import { setupStatusOptions } from '@/hooks/tanstack-query/_query-options';
import { SETUP_STEPS } from '@/lib/constant';
import type { SetupStep } from '@/lib/interfaces';

const searchSchema = z.object({
  blocked: z.string().optional(),
});

export const Route = createFileRoute('/setup')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, location }) => {
    const status = await context.queryClient.fetchQuery(setupStatusOptions());

    if (status.completed) {
      throw redirect({ to: '/' });
    }

    const currentPath = location.pathname.replace('/setup/', '');
    const currentStep = status.currentStep ?? 'admin';
    const currentStepIndex = SETUP_STEPS.indexOf(currentStep);
    const requestedStepIndex = SETUP_STEPS.indexOf(currentPath as SetupStep);

    if (requestedStepIndex > currentStepIndex && requestedStepIndex >= 0) {
      throw redirect({
        to: `/setup/${currentStep}`,
        search: { blocked: currentPath },
      });
    }
  },
  component: SetupLayout,
});

function SetupLayout(): React.JSX.Element {
  const { blocked } = Route.useSearch();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-xl space-y-6">
        <Outlet />
        <BlockedDialog blocked={blocked} />
      </div>
    </div>
  );
}
