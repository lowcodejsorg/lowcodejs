import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';

type Payload = {
  slug: string;
  rowId: string;
  data: Record<string, unknown>;
};

type UseTableRowUpdateProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, Payload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IRow, variables: Payload) => void;
};

export function useUpdateTableRow(
  props: UseTableRowUpdateProps,
): ReturnType<typeof useMutation<IRow, AxiosError | Error, Payload>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: Payload) {
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
