import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowReactionPayload } from '@/lib/payloads';

type UseRowUpdateReactionProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, RowReactionPayload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IRow, variables: RowReactionPayload) => void;
};

export function useRowUpdateReaction(
  props: UseRowUpdateReactionProps,
): UseMutationResult<IRow, AxiosError | Error, RowReactionPayload, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: RowReactionPayload) {
      const route = '/tables/'
        .concat(payload.tableSlug)
        .concat('/rows/')
        .concat(payload.rowId)
        .concat('/reaction');
      const response = await API.post<IRow>(route, {
        field: payload.field,
        type: payload.type,
      });
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(variables.tableSlug),
      });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
