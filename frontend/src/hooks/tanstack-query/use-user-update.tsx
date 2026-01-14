import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import type { UserUpdatePayload } from '@/lib/payloads';

type UseUserUpdateProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, UserUpdatePayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateUser(
  props: UseUserUpdateProps,
): UseMutationResult<IUser, AxiosError | Error, UserUpdatePayload, unknown> {
  return useMutation({
    mutationFn: async function (payload: UserUpdatePayload) {
      const route = '/users/'.concat(payload._id);
      const response = await API.patch<IUser>(route, payload);
      return response.data;
    },
    ...props,
  });
}
