import React from 'react';

import { Spinner } from '@/components/ui/spinner';

export function RowDetailSkeleton(): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner />
    </div>
  );
}
