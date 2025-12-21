import { API } from '@/lib/api';
import { IStorage } from '@/lib/interfaces';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type UseStorageUploadProps = Pick<
  UseMutationOptions<IStorage[], AxiosError | Error, FormData, unknown>,
  'onSuccess' | 'onError'
>;

export function useStorageUpload(props: UseStorageUploadProps) {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const route = '/storage';
      const response = await API.post<IStorage[]>(route, formData);
      return response.data;
    },
    ...props,
  });
}
