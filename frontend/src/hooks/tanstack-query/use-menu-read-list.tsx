import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IMenu } from '@/lib/interfaces';
import { useAuthenticationStore } from '@/stores/authentication';

import { queryKeys } from './_query-keys';

interface UseMenuReadListOptions {
  enabled?: boolean;
}

export function useMenuReadList(
  options?: UseMenuReadListOptions,
): UseQueryResult<Array<IMenu>, Error> {
  const authentication = useAuthenticationStore();
  const isAuthenticated = Boolean(authentication.authenticated?.sub);

  return useQuery({
    queryKey: queryKeys.menus.all,
    queryFn: async function () {
      const route = '/menu';
      const response = await API.get<Array<IMenu>>(route);
      return response.data;
    },
    enabled: options?.enabled ?? isAuthenticated,
  });
}
