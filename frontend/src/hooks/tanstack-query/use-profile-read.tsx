import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import { useAuthStore } from '@/stores/authentication';

export function useProfileRead(): UseQueryResult<IUser> {
  const authentication = useAuthStore();
  const isAuthenticated = Boolean(authentication.user?._id);

  return useQuery({
    queryKey: queryKeys.profile.detail(authentication.user?._id),
    queryFn: async function () {
      const route = '/profile';
      const response = await API.get<IUser>(route);
      return response.data;
    },
    enabled: isAuthenticated,
  });
}
