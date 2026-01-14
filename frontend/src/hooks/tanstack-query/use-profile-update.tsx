import { API } from '@/lib/api';
import { IUser } from '@/lib/interfaces';
import type { ProfileUpdatePayload } from '@/lib/payloads';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

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

export function useUpdateProfile(props: UseProfileUpdateProps) {
  return useMutation({
    mutationFn: async function (payload: ProfileUpdatePayload) {
      const route = '/profile';
      const response = await API.put<IUser>(route, payload);
      return response.data;
    },
    ...props,
  });
}
