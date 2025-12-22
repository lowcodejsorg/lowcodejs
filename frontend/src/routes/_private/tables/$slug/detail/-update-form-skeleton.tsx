import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';

export function UpdateTableFormSkeleton(): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      <Skeleton className="h-32 w-full" /> {/* Logo */}
      <Skeleton className="h-10 w-full" /> {/* Nome */}
      <Skeleton className="h-24 w-full" /> {/* Descrição */}
      <Skeleton className="h-16 w-full" /> {/* Style */}
      <Skeleton className="h-10 w-full" /> {/* Visibility */}
      <Skeleton className="h-10 w-full" /> {/* Collaboration */}
      <Skeleton className="h-10 w-full" /> {/* Botão */}
    </section>
  );
}
