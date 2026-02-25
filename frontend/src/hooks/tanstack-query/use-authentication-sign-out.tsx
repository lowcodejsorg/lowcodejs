import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import { useAuthStore } from '@/stores/authentication';

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function () {
      await API.post('/authentication/sign-out');
      useAuthStore.getState().clear();
      queryClient.clear();
    },
    ...props,
  });
}
