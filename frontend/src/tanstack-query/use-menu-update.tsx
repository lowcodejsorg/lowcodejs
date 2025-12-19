import { API } from '@/lib/api';
import { IMenu } from '@/lib/interfaces';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type Payload = Partial<{
  name: string;
  type: string;
  parent: string | null;
  table: string | null;
  html: string | null;
  url: string | null;
}> & {
  _id: string;
};

type UseMenuUpdateProps = Pick<
  Omit<
    UseMutationOptions<IMenu, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateMenu(props: UseMenuUpdateProps) {
  return useMutation({
    mutationFn: async function ({ _id, ...payload }: Payload) {
      const route = '/menu/'.concat(_id);
      const response = await API.patch<IMenu>(route, payload);
      return response.data;
    },
    ...props,
  });
}
