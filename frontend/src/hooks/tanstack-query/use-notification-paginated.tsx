import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { INotification, Paginated } from '@/lib/interfaces';

type Params = {
  page?: number;
  perPage?: number;
  unreadOnly?: boolean;
};

export function useNotificationPaginated(
  params: Params = {},
): UseQueryResult<Paginated<INotification>, Error> {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 20;
  const unreadOnly = params.unreadOnly ?? false;

  return useQuery({
    queryKey: queryKeys.notifications.paginated({ page, perPage, unreadOnly }),
    queryFn: async function () {
      const response = await API.get<Paginated<INotification>>(
        '/notifications/paginated',
        { params: { page, perPage, unreadOnly } },
      );
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}
