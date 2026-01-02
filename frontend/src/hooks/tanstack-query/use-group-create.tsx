import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IGroup } from '@/lib/interfaces';

type Payload = Pick<IGroup, 'name' | 'description'> & {
  permissions: Array<string>;
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
