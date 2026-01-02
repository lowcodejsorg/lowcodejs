import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { API } from '@/lib/api';

type UseAuthenticationSignOutProps = Pick<
  Omit<
    UseMutationOptions<void, AxiosError | Error, void, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useAuthenticationSignOut(props: UseAuthenticationSignOutProps) {
  return useMutation({
    mutationFn: async function () {
      await API.post('/authentication/sign-out');
    },
    ...props,
  });
}
