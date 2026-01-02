import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';

type Payload = {
  email: string;
  password: string;
};

type UseAuthenticationSignInProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useAuthenticationSignIn(props: UseAuthenticationSignInProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      await API.post('/authentication/sign-in', payload);
      const response = await API.get<IUser>('/profile');
      return response.data;
    },
    ...props,
  });
}
