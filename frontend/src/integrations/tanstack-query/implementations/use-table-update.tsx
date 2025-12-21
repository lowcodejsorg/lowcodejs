import { API } from '@/lib/api';
import { ITable } from '@/lib/interfaces';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type Payload = Partial<
  Pick<ITable, 'name' | 'description' | 'configuration'> & {
    logo: string | null;
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
