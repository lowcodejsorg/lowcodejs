import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';

export function useReadUser(payload: {
  userId: string;
}): UseQueryResult<IUser> {
  return useQuery({
    queryKey: queryKeys.users.detail(payload.userId),
    queryFn: async function () {
      const route = '/users/'.concat(payload.userId);
      const response = await API.get<IUser>(route);
      return response.data;
    },
    enabled: Boolean(payload.userId),
  });
}
