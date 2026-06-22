import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IAuthenticationAccounts, IUser } from '@/lib/interfaces';
import type { SignInPayload } from '@/lib/payloads';
import { useAuthStore } from '@/stores/authentication';

type UseAuthenticationSignInProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, SignInPayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useAuthenticationSignIn(
  props: UseAuthenticationSignInProps,
): UseMutationResult<IUser, AxiosError | Error, SignInPayload> {
  return useMutation({
    mutationFn: async function (payload: SignInPayload) {
      await API.post('/authentication/sign-in', payload);
      // Após o sign-in, a conta recém-logada é a ativa (cookie activeAccountId).
      // Header vazio força /profile e /accounts a resolverem pelo cookie em vez
      // do activeAccountId ainda stale no store (senão voltariam a conta anterior).
      const headers = { 'X-Auth-Account-Id': '' };
      const response = await API.get<IUser>('/profile', { headers });
      const accountsResponse = await API.get<IAuthenticationAccounts>(
        '/authentication/accounts',
        { headers },
      );
      const user = response.data;
      useAuthStore
        .getState()
        .setAccounts(accountsResponse.data.accounts, user._id);
      return user;
    },
    ...props,
  });
}
