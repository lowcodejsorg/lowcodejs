import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IGroup } from '@/lib/interfaces';
import type { UserGroupUpdatePayload } from '@/lib/payloads';

type UseGroupUpdateProps = Pick<
  Omit<
    UseMutationOptions<IGroup, AxiosError | Error, UserGroupUpdatePayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateGroup(props: UseGroupUpdateProps) {
  return useMutation({
    mutationFn: async function (payload: UserGroupUpdatePayload) {
      const route = '/user-group/'.concat(payload._id);
      const response = await API.patch<IGroup>(route, payload);
      return response.data;
    },
    ...props,
  });
}
