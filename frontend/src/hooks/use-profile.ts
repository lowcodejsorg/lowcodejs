import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import { IUser } from '@/lib/interfaces';
import { Route as LayoutRoute } from '@/routes/_private/layout';

export function useProfile(): UseQueryResult<IUser> {
  const loader = LayoutRoute.useLoaderData();

  const query = useQuery({
    queryKey: ['/profile', loader?.sub, loader?.authenticated],
    queryFn: async function () {
      const route = '/profile';
      const response = await API.get<IUser>(route);
      return response.data;
    },
  });

  return query;
}
