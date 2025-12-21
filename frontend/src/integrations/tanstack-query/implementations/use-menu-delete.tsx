import { API } from '@/lib/api';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type Payload = {
  _id: string;
};

type UseMenuDeleteProps = Pick<
  Omit<
    UseMutationOptions<void, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useDeleteMenu(props: UseMenuDeleteProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/menu/'.concat(payload._id);
      await API.delete(route);
    },
    ...props,
  });
}
