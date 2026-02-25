import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { profileDetailOptions } from './_query-options';

import type { IUser } from '@/lib/interfaces';

export function useProfileRead(): UseQueryResult<IUser> {
  return useQuery(profileDetailOptions());
}
