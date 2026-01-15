import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IMenu } from '@/lib/interfaces';

export function useReadMenu(payload: {
  menuId: string;
}): UseQueryResult<IMenu> {
  return useQuery({
    queryKey: ['/menu/'.concat(payload.menuId), payload.menuId],
    queryFn: async function () {
      const route = '/menu/'.concat(payload.menuId);
      const response = await API.get<IMenu>(route);
      return response.data;
    },
    enabled: Boolean(payload.menuId),
  });
}
