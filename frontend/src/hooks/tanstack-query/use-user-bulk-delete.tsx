import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';

type Payload = { ids: Array<string> };
type Result = { deleted: number };

type UseUserBulkDeleteProps = {
  onSuccess?: (data: Result, variables: Payload) => void;
  onError?: (error: AxiosError | Error, variables: Payload) => void;
};

export function useUserBulkDelete(
  props: UseUserBulkDeleteProps = {},
): UseMutationResult<Result, AxiosError | Error, Payload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: Payload) {
      const response = await API.delete<Result>('/users/bulk-delete', {
        data: payload,
      });
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      props.onSuccess?.(data, variables);
    },
    onError(error, variables) {
      props.onError?.(error, variables);
    },
  });
}
