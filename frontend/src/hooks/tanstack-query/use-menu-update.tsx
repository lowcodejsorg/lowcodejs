import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IMenu } from '@/lib/interfaces';
import type { MenuUpdatePayload } from '@/lib/payloads';

type UseMenuUpdateProps = Pick<
  Omit<
    UseMutationOptions<IMenu, AxiosError | Error, MenuUpdatePayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateMenu(props: UseMenuUpdateProps) {
  return useMutation({
    mutationFn: async function ({ _id, ...payload }: MenuUpdatePayload) {
      const route = '/menu/'.concat(_id);
      const response = await API.patch<IMenu>(route, payload);
      return response.data;
    },
    ...props,
  });
}
