import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { groupDetailOptions } from './_query-options';

import type { IGroup } from '@/lib/interfaces';

export function useReadGroup(payload: {
  groupId: string;
}): UseQueryResult<IGroup> {
  return useQuery(groupDetailOptions(payload.groupId));
}
