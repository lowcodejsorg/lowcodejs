import { API } from '@/lib/api';
import { IUser } from '@/lib/interfaces';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type Payload = Partial<
  Pick<IUser, 'name' | 'email' | 'password'> & {
    group: string;
    allowPasswordChange: boolean;
    currentPassword?: string;
    newPassword?: string;
  }
>;

type UseProfileUpdateProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateProfile(props: UseProfileUpdateProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/profile';
      const response = await API.put<IUser>(route, payload);
      return response.data;
    },
    ...props,
  });
}
