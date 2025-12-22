import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IRow, Paginated } from '@/lib/interfaces';

export function useReadTableRowPaginated(payload: {
  slug: string;
}): UseQueryResult<Paginated<IRow>, Error> {
  const route = '/tables/'.concat(payload.slug).concat('/rows/paginated');

  return useQuery({
    queryKey: [route],
    queryFn: async function () {
      const response = await API.get<Paginated<IRow>>(route);
      return response.data;
    },
    enabled: Boolean(payload.slug),
  });
}
