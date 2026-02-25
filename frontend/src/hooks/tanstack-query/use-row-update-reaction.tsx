import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowReactionPayload } from '@/lib/payloads';
import { useAuthStore } from '@/stores/authentication';

type UseRowUpdateReactionProps = {
  onSuccess?: (data: IRow, variables: RowReactionPayload) => void;
  onError?: (error: AxiosError | Error, variables: RowReactionPayload) => void;
};

export function useRowUpdateReaction(
  props: UseRowUpdateReactionProps = {},
): UseMutationResult<
  IRow,
  AxiosError | Error,
  RowReactionPayload,
  { previous?: IRow }
> {
  const queryClient = useQueryClient();

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
    async onMutate(variables) {
      const key = queryKeys.rows.detail(variables.tableSlug, variables.rowId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IRow>(key);

      if (previous) {
        const currentUserId = useAuthStore.getState().user?._id?.toString();
        const reactions = Array.from<Record<string, unknown>>(
          previous[variables.field] ?? [],
        );
        const idx = reactions.findIndex(
          (r) =>
            (r.user as { _id?: string })?._id?.toString() === currentUserId,
        );
        if (idx >= 0) {
          reactions[idx] = { ...reactions[idx], type: variables.type };
        } else {
          reactions.push({
            type: variables.type,
            user: { _id: currentUserId },
          });
        }
        queryClient.setQueryData<IRow>(key, {
          ...previous,
          [variables.field]: reactions,
        });
      }

      return { previous };
    },
    onError(_err, variables, context) {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.rows.detail(variables.tableSlug, variables.rowId),
          context.previous,
        );
      }
      props.onError?.(_err, variables);
    },
    onSuccess(data, variables) {
      queryClient.setQueryData(
        queryKeys.rows.detail(variables.tableSlug, variables.rowId),
        data,
      );
      props.onSuccess?.(data, variables);
    },
    onSettled(_data, _err, variables) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(variables.tableSlug),
      });
    },
  });
}
