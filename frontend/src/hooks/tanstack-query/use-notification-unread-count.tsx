import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';

type Response = { count: number };

export function useNotificationUnreadCount(
  enabled = true,
): UseQueryResult<Response, Error> {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async function () {
      const response = await API.get<Response>('/notifications/unread-count');
      return response.data;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}
