import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IGroup } from '@/lib/interfaces';
import { useAuthenticationStore } from '@/stores/authentication';

export function useGroupReadList(): UseQueryResult<Array<IGroup>, Error> {
  const authenticated = useAuthenticationStore();

  return useQuery({
    queryKey: ['/user-group', authenticated.authenticated?.sub],
    queryFn: async function () {
      const route = '/user-group';
      const response = await API.get<Array<IGroup>>(route);
      return response.data;
    },
  });
}
