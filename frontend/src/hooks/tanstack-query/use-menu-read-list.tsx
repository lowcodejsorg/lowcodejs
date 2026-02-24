import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IMenu } from '@/lib/interfaces';
import { useAuthStore } from '@/stores/authentication';

interface UseMenuReadListOptions {
  enabled?: boolean;
}

export function useMenuReadList(
  options?: UseMenuReadListOptions,
): UseQueryResult<Array<IMenu>, Error> {
  const authentication = useAuthStore();
  const isAuthenticated = Boolean(authentication.user?._id);

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
