import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowActionPayload } from '@/lib/payloads';

type UseRowUpdateTrashProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, RowActionPayload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IRow, variables: RowActionPayload) => void;
};

export function useRowUpdateTrash(
  props: UseRowUpdateTrashProps,
): UseMutationResult<IRow, AxiosError | Error, RowActionPayload, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: RowActionPayload) {
      const route = '/tables/'
        .concat(payload.slug)
        .concat('/rows/')
        .concat(payload.rowId)
        .concat('/trash');
      const response = await API.patch<IRow>(route);
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.detail(variables.slug, variables.rowId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(variables.slug),
      });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
