import { API } from '@/lib/api';
import { IGroup } from '@/lib/interfaces';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type Payload = Partial<
  Pick<IGroup, 'name' | 'description'> & {
    permissions: string[];
  }
> & {
  _id: string;
};

type UseGroupUpdateProps = Pick<
  Omit<
    UseMutationOptions<IGroup, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateGroup(props: UseGroupUpdateProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/user-group/'.concat(payload._id);
      const response = await API.patch<IGroup>(route, payload);
      return response.data;
    },
    ...props,
  });
}
