import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';

type Payload = { ids: string[] };
type Result = { modified: number };

type UseMenuBulkRestoreProps = {
  onSuccess?: (data: Result, variables: Payload) => void;
  onError?: (error: AxiosError | Error, variables: Payload) => void;
};

export function useMenuBulkRestore(
  props: UseMenuBulkRestoreProps = {},
): UseMutationResult<Result, AxiosError | Error, Payload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: Payload) {
      const response = await API.patch<Result>('/menu/bulk-restore', payload);
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
      props.onSuccess?.(data, variables);
    },
    onError(error, variables) {
      props.onError?.(error, variables);
    },
  });
}
