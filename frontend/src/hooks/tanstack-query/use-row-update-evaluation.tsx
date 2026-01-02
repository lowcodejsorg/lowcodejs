import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';

type Payload = {
  tableSlug: string;
  rowId: string;
  user: string;
  field: string;
  value: number;
};

type UseRowUpdateEvaluationProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useRowUpdateEvaluation(props: UseRowUpdateEvaluationProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/tables/'
        .concat(payload.tableSlug)
        .concat('/rows/')
        .concat(payload.rowId)
        .concat('/evaluation');
      const response = await API.post<IRow>(route, {
        user: payload.user,
        field: payload.field,
        value: payload.value,
      });
      return response.data;
    },
    ...props,
  });
}
