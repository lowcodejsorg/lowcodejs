import { API } from '@/lib/api';
import { IUser } from '@/lib/interfaces';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type Payload = Partial<
  Pick<IUser, 'name' | 'email' | 'password' | 'status'> & {
    group: string;
  }
> & {
  _id: string;
};

type UseUserUpdateProps = Pick<
  Omit<
    UseMutationOptions<IUser, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateUser(props: UseUserUpdateProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/users/'.concat(payload._id);
      const response = await API.patch<IUser>(route, payload);
      return response.data;
    },
    ...props,
  });
}
