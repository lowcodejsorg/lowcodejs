import { API } from '@/lib/api';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type UseStorageDeleteProps = Pick<
  UseMutationOptions<void, AxiosError | Error, string, unknown>,
  'onSuccess' | 'onError'
>;

export function useStorageDelete(props: UseStorageDeleteProps) {
  return useMutation({
    mutationFn: async (storageId: string) => {
      const route = '/storage/'.concat(storageId);
      await API.delete(route);
    },
    ...props,
  });
}
