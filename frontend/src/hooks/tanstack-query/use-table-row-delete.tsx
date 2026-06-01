import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { RowActionPayload } from '@/lib/payloads';

type UseDeleteTableRowProps = {
  onSuccess?: (variables: RowActionPayload) => void;
  onError?: (error: AxiosError | Error, variables: RowActionPayload) => void;
};

export function useDeleteTableRow(
  props: UseDeleteTableRowProps,
): UseMutationResult<void, AxiosError | Error, RowActionPayload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: RowActionPayload): Promise<void> {
      const route = '/tables/'
        .concat(payload.slug)
        .concat('/rows/')
        .concat(payload.rowId);
      await API.delete(route);
    },
    onError(error, variables): void {
      props.onError?.(error, variables);
    },
    onSuccess(_data, variables): void {
      props.onSuccess?.(variables);
    },
    onSettled(_data, _error, variables): void {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(variables.slug),
      });
    },
  });
}
