import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';

type Result = { deleted: number };

type UseMenuEmptyTrashProps = {
  onSuccess?: (data: Result) => void;
  onError?: (error: AxiosError | Error) => void;
};

export function useMenuEmptyTrash(
  props: UseMenuEmptyTrashProps = {},
): UseMutationResult<Result, AxiosError | Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function () {
      const response = await API.delete<Result>('/menu/empty-trash');
      return response.data;
    },
    onSuccess(data) {
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
      props.onSuccess?.(data);
    },
    onError(error) {
      props.onError?.(error);
    },
  });
}
