import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { ITable } from '@/lib/interfaces';

export function useReadTable(payload: {
  slug: string;
}): UseQueryResult<ITable, Error> {
  return useQuery({
    queryKey: ['/tables/'.concat(payload.slug), payload.slug],
    queryFn: async function () {
      const route = '/tables/'.concat(payload.slug);
      const response = await API.get<ITable>(route);
      return response.data;
    },
    enabled: Boolean(payload.slug),
  });
}
