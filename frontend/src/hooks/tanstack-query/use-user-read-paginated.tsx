import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IUser, Paginated } from '@/lib/interfaces';
import type { BaseQueryPayload } from '@/lib/payloads';

export function useUserReadPaginated(
  params?: BaseQueryPayload,
): UseQueryResult<Paginated<IUser>, Error> {
  const search = params ?? { page: 1, perPage: 50 };

  return useQuery({
    queryKey: ['/users/paginated', search],
    queryFn: async () => {
      const response = await API.get<Paginated<IUser>>('/users/paginated', {
        params: search,
      });
      return response.data;
    },
  });
}
