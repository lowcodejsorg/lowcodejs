import { API } from '@/lib/api';
import { ITable } from '@/lib/interfaces';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type Payload = Pick<ITable, 'name'> & {
  description?: string | null;
  logo?: string | null;
};

type UseTableCreateProps = Pick<
  Omit<
    UseMutationOptions<ITable, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useCreateTable(props: UseTableCreateProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/tables';
      const response = await API.post<ITable>(route, payload);
      return response.data;
    },
    ...props,
  });
}
