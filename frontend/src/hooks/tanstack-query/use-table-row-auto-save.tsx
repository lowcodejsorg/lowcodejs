import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowAutoSavePayload } from '@/lib/payloads';

type UseAutoSaveTableRowProps = Pick<
  Omit<
    UseMutationOptions<IRow, AxiosError | Error, RowAutoSavePayload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IRow, variables: RowAutoSavePayload) => void;
};

export function useAutoSaveTableRow(
  props: UseAutoSaveTableRowProps,
): UseMutationResult<IRow, AxiosError | Error, RowAutoSavePayload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: RowAutoSavePayload): Promise<IRow> {
      const base = '/tables/'.concat(payload.slug).concat('/rows/auto-save');
      let url = base;
      if (payload.rowId) {
        url = base.concat('?_id=').concat(payload.rowId);
      }
      const response = await API.patch<IRow>(url, payload.data);
      return response.data;
    },
    onSuccess(data, variables): void {
      queryClient.setQueryData(
        queryKeys.rows.detail(variables.slug, data._id),
        data,
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(variables.slug),
      });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
