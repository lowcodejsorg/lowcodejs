import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';

type UseAuthenticationSignOutProps = Pick<
  Omit<
    UseMutationOptions<void, AxiosError | Error, void, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useAuthenticationSignOut(
  props: UseAuthenticationSignOutProps,
): UseMutationResult<void, AxiosError | Error, void, unknown> {
  return useMutation({
    mutationFn: async function () {
      await API.post('/authentication/sign-out');
    },
    ...props,
  });
}
