import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import type { ProfileUpdatePayload } from '@/lib/payloads';

type UseProfileUpdateProps = Pick<
  Omit<
    UseMutationOptions<
      IUser,
      AxiosError | Error,
      ProfileUpdatePayload,
      unknown
    >,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateProfile(
  props: UseProfileUpdateProps,
): UseMutationResult<IUser, AxiosError | Error, ProfileUpdatePayload, unknown> {
  return useMutation({
    mutationFn: async function (payload: ProfileUpdatePayload) {
      const route = '/profile';
      const response = await API.put<IUser>(route, payload);
      return response.data;
    },
    ...props,
  });
}
