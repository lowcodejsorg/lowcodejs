import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { ITable } from '@/lib/interfaces';

type Payload = Partial<
  Pick<ITable, 'name' | 'description' | 'configuration' | 'methods'> & {
    logo: string | null;
    fields: string[];
  }
> & {
  slug: string;
};

type UseTableUpdateProps = Pick<
  Omit<
    UseMutationOptions<ITable, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateTable(props: UseTableUpdateProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/tables/'.concat(payload.slug);
      const response = await API.put<ITable>(route, payload);
      return response.data;
    },
    ...props,
  });
}
