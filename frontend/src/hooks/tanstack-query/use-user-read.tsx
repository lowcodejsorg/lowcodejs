import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { userDetailOptions } from './_query-options';

import type { IUser } from '@/lib/interfaces';

export function useReadUser(payload: {
  userId: string;
}): UseQueryResult<IUser> {
  return useQuery(userDetailOptions(payload.userId));
}
