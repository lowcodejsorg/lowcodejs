import { API } from '@/lib/api';
import { IUser } from '@/lib/interfaces';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type Payload = Pick<IUser, 'name' | 'email' | 'password'> & {
  group: string;
};

type UseUserCreateProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useCreateUser(props: UseUserCreateProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/users';
      const response = await API.post<IUser>(route, payload);
      return response.data;
    },
    ...props,
  });
}
