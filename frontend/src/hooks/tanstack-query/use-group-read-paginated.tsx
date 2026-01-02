import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IGroup, Paginated } from '@/lib/interfaces';

type SearchParams = {
  page?: number;
  perPage?: number;
  search?: string;
};

export function useGroupReadPaginated(
  params?: SearchParams,
): UseQueryResult<Paginated<IGroup>, Error> {
  const search = params ?? { page: 1, perPage: 50 };

  return useQuery({
    queryKey: ['/user-group/paginated', search],
    queryFn: async () => {
      const response = await API.get<Paginated<IGroup>>(
        '/user-group/paginated',
        {
          params: search,
        },
      );
      return response.data;
    },
  });
}
