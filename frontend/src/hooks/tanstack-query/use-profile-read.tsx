import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import { useAuthenticationStore } from '@/stores/authentication';

export function useProfileRead(): UseQueryResult<IUser> {
  const authentication = useAuthenticationStore();
  const isAuthenticated = Boolean(authentication.authenticated?.sub);

  return useQuery({
    queryKey: ['/profile', authentication.authenticated?.sub],
    queryFn: async function () {
      const route = '/profile';
      const response = await API.get<IUser>(route);
      return response.data;
    },
    enabled: isAuthenticated,
  });
}
