import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import type * as React from 'react';
import { z } from 'zod';

import { setupStatusOptions } from '@/hooks/tanstack-query/_query-options';
import { SETUP_STEPS } from '@/lib/constant';
import type { SetupStep } from '@/lib/interfaces';

import { BlockedDialog } from './-blocked-dialog';

const searchSchema = z.object({
  blocked: z.string().optional(),
});

export const Route = createFileRoute('/_setup')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, location }) => {
    const status = await context.queryClient.ensureQueryData(
      setupStatusOptions(),
    );

    if (status.completed) {
      throw redirect({ to: '/' });
    }

    const currentPath = location.pathname.replace('/setup/', '');
    const currentStep = (status.currentStep ?? 'admin') as SetupStep;
    const currentStepIndex = SETUP_STEPS.indexOf(currentStep);
    const requestedStepIndex = SETUP_STEPS.indexOf(
      currentPath as SetupStep,
    );

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Outlet />
        <BlockedDialog blocked={blocked} />
      </div>
    </div>
  );
}
