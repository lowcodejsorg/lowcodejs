import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { SignUpPayload } from '@/lib/payloads';

type UseAuthenticationSignUpProps = Pick<
  Omit<
    UseMutationOptions<void, AxiosError | Error, SignUpPayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useAuthenticationSignUp(
  props: UseAuthenticationSignUpProps,
): UseMutationResult<void, AxiosError | Error, SignUpPayload, unknown> {
  return useMutation({
    mutationFn: async function (payload: SignUpPayload) {
      await API.post('/authentication/sign-up', payload);
    },
    ...props,
  });
}
