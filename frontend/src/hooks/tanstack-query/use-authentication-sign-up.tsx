import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { SignUpPayload } from '@/lib/payloads';

type UseAuthenticationSignUpProps = Pick<
  Omit<
    UseMutationOptions<void, AxiosError | Error, SignUpPayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useAuthenticationSignUp(props: UseAuthenticationSignUpProps) {
  return useMutation({
    mutationFn: async function (payload: SignUpPayload) {
      await API.post('/authentication/sign-up', payload);
    },
    ...props,
  });
}
