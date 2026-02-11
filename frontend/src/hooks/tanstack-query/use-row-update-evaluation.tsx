import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowEvaluationPayload } from '@/lib/payloads';

type UseRowUpdateEvaluationProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, RowEvaluationPayload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IRow, variables: RowEvaluationPayload) => void;
};

export function useRowUpdateEvaluation(
  props: UseRowUpdateEvaluationProps,
): UseMutationResult<IRow, AxiosError | Error, RowEvaluationPayload, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: RowEvaluationPayload) {
      const route = '/tables/'
        .concat(payload.tableSlug)
        .concat('/rows/')
        .concat(payload.rowId)
        .concat('/evaluation');
      const response = await API.post<IRow>(route, {
        field: payload.field,
        value: payload.value,
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
