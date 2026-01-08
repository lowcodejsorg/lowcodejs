import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowReactionPayload } from '@/lib/payloads';

type UseRowUpdateReactionProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, RowReactionPayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useRowUpdateReaction(props: UseRowUpdateReactionProps) {
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
    ...props,
  });
}
