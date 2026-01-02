import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IGroup } from '@/lib/interfaces';

export function useGroupReadList(): UseQueryResult<Array<IGroup>, Error> {
  return useQuery({
    queryKey: ['/user-group'],
    queryFn: async function () {
      const route = '/user-group';
      const response = await API.get<Array<IGroup>>(route);
      return response.data;
    },
  });
}
