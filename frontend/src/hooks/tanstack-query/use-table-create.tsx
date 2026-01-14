import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { ITable } from '@/lib/interfaces';
import type { TableCreatePayload } from '@/lib/payloads';

type UseTableCreateProps = Pick<
  Omit<
    UseMutationOptions<ITable, AxiosError | Error, TableCreatePayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useCreateTable(
  props: UseTableCreateProps,
): UseMutationResult<ITable, AxiosError | Error, TableCreatePayload, unknown> {
  return useMutation({
    mutationFn: async function (payload: TableCreatePayload) {
      const route = '/tables';
      const response = await API.post<ITable>(route, payload);
      return response.data;
    },
    ...props,
  });
}
