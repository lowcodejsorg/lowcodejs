import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import type { SignInPayload } from '@/lib/payloads';

type UseAuthenticationSignInProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, SignInPayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useAuthenticationSignIn(props: UseAuthenticationSignInProps) {
  return useMutation({
    mutationFn: async function (payload: SignInPayload) {
      await API.post('/authentication/sign-in', payload);
      const response = await API.get<IUser>('/profile');
      return response.data;
    },
    ...props,
  });
}
