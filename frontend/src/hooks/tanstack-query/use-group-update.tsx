import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IGroup } from '@/lib/interfaces';
import type { UserGroupUpdatePayload } from '@/lib/payloads';

import { queryKeys } from './_query-keys';

type UseGroupUpdateProps = Pick<
  Omit<
    UseMutationOptions<
      IGroup,
      AxiosError | Error,
      UserGroupUpdatePayload,
      unknown
    >,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IGroup, variables: UserGroupUpdatePayload) => void;
};

export function useUpdateGroup(
  props: UseGroupUpdateProps,
): UseMutationResult<
  IGroup,
  AxiosError | Error,
  UserGroupUpdatePayload,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: UserGroupUpdatePayload) {
      const route = '/user-group/'.concat(payload._id);
      const response = await API.patch<IGroup>(route, payload);
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(variables._id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
