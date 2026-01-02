import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IMenu } from '@/lib/interfaces';

export function usePageRead(payload: {
  slug: string;
}): UseQueryResult<IMenu, Error> {
  const route = '/pages/'.concat(payload.slug);

  return useQuery({
    queryKey: [route, payload.slug],
    queryFn: async () => {
      const response = await API.get<IMenu>(route);
      return response.data;
    },
    enabled: Boolean(payload.slug),
  });
}
