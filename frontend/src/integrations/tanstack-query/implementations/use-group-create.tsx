import { API } from '@/lib/api';
import { IGroup } from '@/lib/interfaces';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type Payload = Pick<IGroup, 'name' | 'description'> & {
  permissions: string[];
};

type UseGroupCreateProps = Pick<
  Omit<
    UseMutationOptions<IGroup, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useCreateGroup(props: UseGroupCreateProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/user-group';
      const response = await API.post<IGroup>(route, payload);
      return response.data;
    },
    ...props,
  });
}
