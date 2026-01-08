import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { ITable } from '@/lib/interfaces';
import type { TableUpdatePayload } from '@/lib/payloads';

type UseTableUpdateProps = Pick<
  Omit<
    UseMutationOptions<ITable, AxiosError | Error, TableUpdatePayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateTable(props: UseTableUpdateProps) {
  return useMutation({
    mutationFn: async function (payload: TableUpdatePayload) {
      const route = '/tables/'.concat(payload.slug);
      const response = await API.put<ITable>(route, payload);
      return response.data;
    },
    ...props,
  });
}
