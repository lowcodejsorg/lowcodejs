import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { API } from '@/lib/api';

type Payload = {
  name: string;
  email: string;
  password: string;
};

type UseAuthenticationSignUpProps = Pick<
  Omit<
    UseMutationOptions<void, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useAuthenticationSignUp(props: UseAuthenticationSignUpProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      await API.post('/authentication/sign-up', payload);
    },
    ...props,
  });
}
