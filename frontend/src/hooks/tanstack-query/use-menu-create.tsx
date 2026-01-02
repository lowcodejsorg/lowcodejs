import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { MENU_ITEM_TYPE } from '@/lib/constant';
import type { IMenu } from '@/lib/interfaces';

type Payload = {
  name: string;
  type: keyof typeof MENU_ITEM_TYPE;
  parent?: string | null;
  table?: string | null;
  html?: string | null;
  url?: string | null;
};

type UseMenuCreateProps = Pick<
  Omit<
    UseMutationOptions<IMenu, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useCreateMenu(props: UseMenuCreateProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const response = await API.post<IMenu>('/menu', payload);
      return response.data;
    },
    ...props,
  });
}
