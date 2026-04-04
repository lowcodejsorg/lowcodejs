import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { RequestCodePayload } from '@/lib/payloads';

type UseAuthenticationRequestCodeProps = Pick<
  Omit<
    UseMutationOptions<void, AxiosError | Error, RequestCodePayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useAuthenticationRequestCode(
  props: UseAuthenticationRequestCodeProps,
): UseMutationResult<void, AxiosError | Error, RequestCodePayload> {
  return useMutation({
    mutationFn: async function (payload: RequestCodePayload) {
      await API.post('/authentication/recovery/request-code', payload);
    },
    ...props,
  });
}
