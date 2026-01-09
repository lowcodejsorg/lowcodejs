import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { ITable, Paginated } from '@/lib/interfaces';
import type { TableQueryPayload } from '@/lib/payloads';

export function useTablesReadPaginated(
  params?: TableQueryPayload,
): UseQueryResult<Paginated<ITable>, Error> {
  const search = params ?? { page: 1, perPage: 50 };

  return useQuery({
    queryKey: ['/tables/paginated', search],
    queryFn: async () => {
      const response = await API.get<Paginated<ITable>>('/tables/paginated', {
        params: search,
      });
      return response.data;
    },
  });
}
