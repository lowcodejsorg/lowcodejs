import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';

type Response = { updated: number };

type UseNotificationMarkAllAsReadProps = {
  onSuccess?: (data: Response) => void;
  onError?: (error: AxiosError | Error) => void;
};

export function useNotificationMarkAllAsRead(
  props: UseNotificationMarkAllAsReadProps = {},
): UseMutationResult<Response, AxiosError | Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function () {
      const response = await API.patch<Response>('/notifications/read-all');
      return response.data;
    },
    onSuccess(data) {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      props.onSuccess?.(data);
    },
    onError(error) {
      props.onError?.(error);
    },
  });
}
