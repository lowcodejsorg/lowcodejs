import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';

type Payload = { _id: string };

type UseUserDeleteProps = {
  onSuccess?: (variables: Payload) => void;
  onError?: (error: AxiosError | Error, variables: Payload) => void;
};

export function useUserDelete(
  props: UseUserDeleteProps = {},
): UseMutationResult<null, AxiosError | Error, Payload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/users/'.concat(payload._id);
      const response = await API.delete<null>(route);
      return response.data;
    },
    onSuccess(_data, variables) {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      props.onSuccess?.(variables);
    },
    onError(error, variables) {
      props.onError?.(error, variables);
    },
  });
}
