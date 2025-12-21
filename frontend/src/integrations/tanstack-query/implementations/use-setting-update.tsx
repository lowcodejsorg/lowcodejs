import { API } from '@/lib/api';
import { ISetting } from '@/lib/interfaces';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type Payload = Partial<Omit<ISetting, 'FILE_UPLOAD_ACCEPTED'>> & {
  FILE_UPLOAD_ACCEPTED: string;
};

type UseSettingUpdateProps = Pick<
  Omit<
    UseMutationOptions<ISetting, AxiosError | Error, Payload, unknown>,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateSetting(props: UseSettingUpdateProps) {
  return useMutation({
    mutationFn: async function (payload: Payload) {
      const route = '/setting';
      const response = await API.put<ISetting>(route, payload);
      return response.data;
    },
    ...props,
  });
}
