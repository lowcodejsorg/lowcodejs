import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowUpdatePayload } from '@/lib/payloads';

type UseTableRowUpdateProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, RowUpdatePayload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IRow, variables: RowUpdatePayload) => void;
};

export function useUpdateTableRow(
  props: UseTableRowUpdateProps,
): ReturnType<typeof useMutation<IRow, AxiosError | Error, RowUpdatePayload>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: RowUpdatePayload) {
      const route = '/tables/'
        .concat(payload.slug)
        .concat('/rows/')
        .concat(payload.rowId);
      const response = await API.put<IRow>(route, payload.data);
      return response.data;
    },
    onSuccess(data, variables) {
      const route = '/tables/'
        .concat(variables.slug)
        .concat('/rows/')
        .concat(variables.rowId);
      queryClient.setQueryData([route, variables.rowId], data);

      queryClient.invalidateQueries({
        queryKey: ['/tables/'.concat(variables.slug).concat('/rows/paginated')],
      });

      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
