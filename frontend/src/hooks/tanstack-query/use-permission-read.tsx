import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IPermission } from '@/lib/interfaces';

export function usePermissionRead(): UseQueryResult<Array<IPermission>, Error> {
  return useQuery({
    queryKey: ['/permissions'],
    queryFn: async () => {
      const response = await API.get<Array<IPermission>>('/permissions');
      return response.data;
    },
  });
}
