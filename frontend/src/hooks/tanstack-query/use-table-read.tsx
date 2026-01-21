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

interface PaginatedTablesResponse {
  data: Array<ITable>;
  meta: {
    page: number;
    perPage: number;
    total: number;
  };
}

export function useReadTables(payload?: {
  page?: number;
  perPage?: number;
}): UseQueryResult<Array<ITable>, Error> {
  const page = payload?.page ?? 1;
  const perPage = payload?.perPage ?? 50;

  return useQuery({
    queryKey: ['/tables/paginated', page, perPage],
    queryFn: async () => {
      const response = await API.get<PaginatedTablesResponse>(
        '/tables/paginated',
        {
          params: { page, perPage },
        },
      );

      return response.data.data;
    },
  });
}
