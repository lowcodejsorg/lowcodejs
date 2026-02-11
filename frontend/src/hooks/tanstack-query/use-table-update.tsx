import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { ITable } from '@/lib/interfaces';
import type { TableUpdatePayload } from '@/lib/payloads';

type UseTableUpdateProps = Pick<
  Omit<
    UseMutationOptions<ITable, AxiosError | Error, TableUpdatePayload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: ITable, variables: TableUpdatePayload) => void;
};

export function useUpdateTable(
  props: UseTableUpdateProps,
): UseMutationResult<ITable, AxiosError | Error, TableUpdatePayload, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: TableUpdatePayload) {
      const route = '/tables/'.concat(payload.slug);
      const response = await API.put<ITable>(route, payload);
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(variables.slug),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.lists() });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
