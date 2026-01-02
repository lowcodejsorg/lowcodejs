import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';

type Payload = {
  tableSlug: string;
  rowId: string;
  user: string;
  field: string;
  type: 'like' | 'unlike';
};

type UseRowUpdateReactionProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useRowUpdateReaction(props: UseRowUpdateReactionProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/tables/'
        .concat(payload.tableSlug)
        .concat('/rows/')
        .concat(payload.rowId)
        .concat('/reaction');
      const response = await API.post<IRow>(route, {
        user: payload.user,
        field: payload.field,
        type: payload.type,
      });
      return response.data;
    },
    ...props,
  });
}
