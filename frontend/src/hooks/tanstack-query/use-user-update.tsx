import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import type { UserUpdatePayload } from '@/lib/payloads';

type UseUserUpdateProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, UserUpdatePayload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IUser, variables: UserUpdatePayload) => void;
};

export function useUpdateUser(
  props: UseUserUpdateProps,
): UseMutationResult<IUser, AxiosError | Error, UserUpdatePayload, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: UserUpdatePayload) {
      const route = '/users/'.concat(payload._id);
      const response = await API.patch<IUser>(route, payload);
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables._id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
