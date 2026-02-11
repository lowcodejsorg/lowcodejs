import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IGroup } from '@/lib/interfaces';

export function useGroupReadList(): UseQueryResult<Array<IGroup>, Error> {
  return useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: async function () {
      const route = '/user-group';
      const response = await API.get<Array<IGroup>>(route);
      return response.data;
    },
  });
}
