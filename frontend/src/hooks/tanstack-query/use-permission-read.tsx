import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IPermission } from '@/lib/interfaces';

export function usePermissionRead(): UseQueryResult<Array<IPermission>, Error> {
  return useQuery({
    queryKey: queryKeys.permissions.all,
    queryFn: async () => {
      const response = await API.get<Array<IPermission>>('/permissions');
      return response.data;
    },
  });
}
