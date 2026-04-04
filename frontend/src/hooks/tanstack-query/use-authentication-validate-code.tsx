import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import type { ValidateCodePayload } from '@/lib/payloads';
import { useAuthStore } from '@/stores/authentication';

type ValidateCodeResponse = {
  user: IUser;
};

type UseAuthenticationValidateCodeProps = Pick<
  Omit<
    UseMutationOptions<
      ValidateCodeResponse,
      AxiosError | Error,
      ValidateCodePayload,
      unknown
    >,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useAuthenticationValidateCode(
  props: UseAuthenticationValidateCodeProps,
): UseMutationResult<
  ValidateCodeResponse,
  AxiosError | Error,
  ValidateCodePayload
> {
  return useMutation({
    mutationFn: async function (payload: ValidateCodePayload) {
      const response = await API.post<ValidateCodeResponse>(
        '/authentication/recovery/validate-code',
        payload,
      );
      useAuthStore.getState().setUser(response.data.user);
      return response.data;
    },
    ...props,
  });
}
