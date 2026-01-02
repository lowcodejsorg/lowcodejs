import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IRow, Paginated } from '@/lib/interfaces';

type Params = {
  tableSlug: string;
  fieldSlug: string;
  search?: string;
  page?: number;
  perPage?: number;
  enabled?: boolean;
};

export function useRelationshipRowsReadPaginated(
  params: Params,
): UseQueryResult<Paginated<IRow>, Error> {
  const { tableSlug, fieldSlug, search, page = 1, perPage = 10, enabled = true } = params;

  return useQuery({
    queryKey: ['relationship', fieldSlug, tableSlug, search],
    queryFn: async () => {
      const response = await API.get<Paginated<IRow>>(
        `/tables/${tableSlug}/rows/paginated`,
        {
          params: {
            page,
            perPage,
            ...(search && { search }),
          },
        },
      );
      return response.data;
    },
    enabled: Boolean(tableSlug) && enabled,
  });
}
