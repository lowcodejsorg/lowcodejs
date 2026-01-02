import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';

type Payload = {
  slug: string;
  rowId: string;
};

type UseRowUpdateRestoreProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useRowUpdateRestore(props: UseRowUpdateRestoreProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/tables/'
        .concat(payload.slug)
        .concat('/rows/')
        .concat(payload.rowId)
        .concat('/restore');
      const response = await API.patch<IRow>(route);
      return response.data;
    },
    ...props,
  });
}
