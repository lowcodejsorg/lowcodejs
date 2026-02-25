import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import type { RowEvaluationPayload } from '@/lib/payloads';
import { useAuthStore } from '@/stores/authentication';

type UseRowUpdateEvaluationProps = {
  onSuccess?: (data: IRow, variables: RowEvaluationPayload) => void;
  onError?: (
    error: AxiosError | Error,
    variables: RowEvaluationPayload,
  ) => void;
};

export function useRowUpdateEvaluation(
  props: UseRowUpdateEvaluationProps = {},
): UseMutationResult<
  IRow,
  AxiosError | Error,
  RowEvaluationPayload,
  { previous?: IRow }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: RowEvaluationPayload) {
      const route = '/tables/'
        .concat(payload.tableSlug)
        .concat('/rows/')
        .concat(payload.rowId)
        .concat('/evaluation');
      const response = await API.post<IRow>(route, {
        field: payload.field,
        value: payload.value,
      });
      return response.data;
    },
    async onMutate(variables) {
      const key = queryKeys.rows.detail(variables.tableSlug, variables.rowId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IRow>(key);

      if (previous) {
        const currentUserId = useAuthStore.getState().user?._id?.toString();
        const evaluations = Array.from<Record<string, unknown>>(
          previous[variables.field] ?? [],
        );
        const idx = evaluations.findIndex(
          (e) =>
            (e.user as { _id?: string })?._id?.toString() === currentUserId,
        );
        if (idx >= 0) {
          evaluations[idx] = { ...evaluations[idx], value: variables.value };
        } else {
          evaluations.push({
            value: variables.value,
            user: { _id: currentUserId },
          });
        }
        queryClient.setQueryData<IRow>(key, {
          ...previous,
          [variables.field]: evaluations,
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
