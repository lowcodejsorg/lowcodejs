import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import type { UserCreatePayload } from '@/lib/payloads';

type UseUserCreateProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, UserCreatePayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useCreateUser(props: UseUserCreateProps) {
  return useMutation({
    mutationFn: async function (payload: UserCreatePayload) {
      const route = '/users';
      const response = await API.post<IUser>(route, payload);
      return response.data;
    },
    ...props,
  });
}
