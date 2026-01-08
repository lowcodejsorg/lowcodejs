import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IMenu, Paginated } from '@/lib/interfaces';
import type { BaseQueryPayload } from '@/lib/payloads';

export function useMenuReadPaginated(
  params?: BaseQueryPayload,
): UseQueryResult<Paginated<IMenu>, Error> {
  const search = params ?? { page: 1, perPage: 50 };

  return useQuery({
    queryKey: ['/menu/paginated', search],
    queryFn: async () => {
      const response = await API.get<Paginated<IMenu>>('/menu/paginated', {
        params: search,
      });
      return response.data;
    },
  });
}
