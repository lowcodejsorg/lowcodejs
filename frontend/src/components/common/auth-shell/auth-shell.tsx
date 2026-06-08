import type * as React from 'react';

import { BrandPanel } from './brand-panel';
import { PittLogo } from './pitt-logo';

import { Logo } from '@/components/common/layout/logo';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  children: React.ReactNode;
  contentClassName?: string;
}

export function AuthShell({
  children,
  contentClassName,
}: AuthShellProps): React.JSX.Element {
  return (
    <div
      data-slot="auth-shell"
      className="min-h-svh lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
    >
      <BrandPanel className="hidden lg:flex" />

      <main className="bg-ambient-cool relative flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6 lg:min-h-0 lg:py-16">
        <div className="flex flex-col items-center gap-3 lg:hidden">
          <div className="rounded-xl bg-[#050807] px-4 py-3 shadow-sm">
            <PittLogo className="h-12 max-w-[220px]" />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span>powered by</span>
            <Logo className="h-4 w-auto" />
          </div>
        </div>

        <div
          className={cn('animate-rise-in w-full max-w-md', contentClassName)}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
