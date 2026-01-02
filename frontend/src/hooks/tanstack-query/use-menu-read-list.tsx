import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IMenu } from '@/lib/interfaces';

export function useMenuReadList(): UseQueryResult<Array<IMenu>, Error> {
  return useQuery({
    queryKey: ['/menu'],
    queryFn: async function () {
      const route = '/menu';
      const response = await API.get<Array<IMenu>>(route);
      return response.data;
    },
  });
}
