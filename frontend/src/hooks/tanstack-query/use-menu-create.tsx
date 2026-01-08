import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IMenu } from '@/lib/interfaces';
import type { MenuCreatePayload } from '@/lib/payloads';

type UseMenuCreateProps = Pick<
  Omit<
    UseMutationOptions<IMenu, AxiosError | Error, MenuCreatePayload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useCreateMenu(props: UseMenuCreateProps) {
  return useMutation({
    mutationFn: async function (payload: MenuCreatePayload) {
      const response = await API.post<IMenu>('/menu', payload);
      return response.data;
    },
    ...props,
  });
}
