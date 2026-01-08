import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IGroup } from '@/lib/interfaces';
import type { UserGroupCreatePayload } from '@/lib/payloads';

type UseGroupCreateProps = Pick<
  Omit<
    UseMutationOptions<IGroup, AxiosError | Error, UserGroupCreatePayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useCreateGroup(props: UseGroupCreateProps) {
  return useMutation({
    mutationFn: async function (payload: UserGroupCreatePayload) {
      const route = '/user-group';
      const response = await API.post<IGroup>(route, payload);
      return response.data;
    },
    ...props,
  });
}
