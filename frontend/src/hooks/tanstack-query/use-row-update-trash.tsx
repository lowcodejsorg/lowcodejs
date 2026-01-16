import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowActionPayload } from '@/lib/payloads';

type UseRowUpdateTrashProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, RowActionPayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useRowUpdateTrash(
  props: UseRowUpdateTrashProps,
): UseMutationResult<IRow, AxiosError | Error, RowActionPayload, unknown> {
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
    ...props,
  });
}
