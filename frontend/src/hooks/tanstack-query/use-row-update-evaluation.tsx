import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowEvaluationPayload } from '@/lib/payloads';

type UseRowUpdateEvaluationProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, RowEvaluationPayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useRowUpdateEvaluation(props: UseRowUpdateEvaluationProps) {
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
    ...props,
  });
}
