import type * as React from 'react';

import { SETUP_STEPS, SETUP_STEP_LABELS } from '@/lib/constant';
import type { SetupStep } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

const STATE_STYLES = {
  completed: 'bg-primary text-primary-foreground',
  active:
    'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
  pending: 'bg-muted text-muted-foreground',
} as const;

interface StepperProps {
  currentStep: SetupStep;
}

function resolveState(
  index: number,
  currentIndex: number,
): 'completed' | 'active' | 'pending' {
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'active';
  return 'pending';
}

export function Stepper({ currentStep }: StepperProps): React.JSX.Element {
  const currentIndex = SETUP_STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center gap-2">
      {SETUP_STEPS.map((step, index) => {
        const state = resolveState(index, currentIndex);

        return (
          <div
            key={step}
            className="flex flex-1 items-center gap-2"
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  STATE_STYLES[state],
                )}
              >
                {index + 1}
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {SETUP_STEP_LABELS[step]}
              </span>
            </div>
            {index < SETUP_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1',
                  index < currentIndex ? 'bg-primary' : 'bg-muted',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
