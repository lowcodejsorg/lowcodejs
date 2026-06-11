import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';

type Result = { deleted: number };

type UseGroupEmptyTrashProps = {
  onSuccess?: (data: Result) => void;
  onError?: (error: AxiosError | Error) => void;
};

export function useGroupEmptyTrash(
  props: UseGroupEmptyTrashProps = {},
): UseMutationResult<Result, AxiosError | Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function () {
      const response = await API.delete<Result>('/user-group/empty-trash');
      return response.data;
    },
    onSuccess(data) {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      props.onSuccess?.(data);
    },
    onError(error) {
      props.onError?.(error);
    },
  });
}
