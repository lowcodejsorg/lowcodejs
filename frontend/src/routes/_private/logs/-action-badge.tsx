import React from 'react';

import { ACTION_META } from './-constants';
import type { ActionType } from './-constants';

import { Badge } from '@/components/ui/badge';
import { LOGGER_ACTION_LABEL } from '@/lib/constant';
import { cn } from '@/lib/utils';

export function ActionBadge({
  action,
}: {
  action: ActionType;
}): React.JSX.Element {
  const meta = ACTION_META[action];
  const Icon = meta.icon;
  return (
    <Badge
      className={cn('font-semibold border-transparent gap-1', meta.className)}
    >
      <Icon className="size-3" />
      {LOGGER_ACTION_LABEL[action]}
    </Badge>
  );
}
