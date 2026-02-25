import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowActionPayload } from '@/lib/payloads';

type UseRowUpdateTrashProps = {
  onSuccess?: (data: IRow, variables: RowActionPayload) => void;
  onError?: (error: AxiosError | Error, variables: RowActionPayload) => void;
};

export function useRowUpdateTrash(
  props: UseRowUpdateTrashProps,
): UseMutationResult<
  IRow,
  AxiosError | Error,
  RowActionPayload,
  { previous?: IRow }
> {
  const queryClient = useQueryClient();

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
    async onMutate(variables) {
      const key = queryKeys.rows.detail(variables.slug, variables.rowId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IRow>(key);
      if (previous) {
        queryClient.setQueryData<IRow>(key, { ...previous, trashed: true });
      }
      return { previous };
    },
    onError(_err, variables, context) {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.rows.detail(variables.slug, variables.rowId),
          context.previous,
        );
      }
      props.onError?.(_err, variables);
    },
    onSuccess(data, variables) {
      queryClient.setQueryData(
        queryKeys.rows.detail(variables.slug, variables.rowId),
        data,
      );
      props.onSuccess?.(data, variables);
    },
    onSettled(_data, _err, variables) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(variables.slug),
      });
    },
  });
}
