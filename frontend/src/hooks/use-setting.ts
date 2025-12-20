import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import { ISetting } from '@/lib/interfaces';

export function useSetting(): UseQueryResult<ISetting> {
  const query = useQuery({
    queryKey: ['/setting'],
    queryFn: async function () {
      const route = '/setting';
      const response = await API.get<ISetting>(route);
      return response.data;
    },
  });

  return query;
}
