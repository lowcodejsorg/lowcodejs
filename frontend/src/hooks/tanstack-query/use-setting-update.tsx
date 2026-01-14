import { API } from '@/lib/api';
import { ISetting } from '@/lib/interfaces';
import type { SettingUpdatePayload } from '@/lib/payloads';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

type UseSettingUpdateProps = Pick<
  Omit<
    UseMutationOptions<
      ISetting,
      AxiosError | Error,
      SettingUpdatePayload,
      unknown
    >,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useUpdateSetting(props: UseSettingUpdateProps) {
  return useMutation({
    mutationFn: async function (payload: SettingUpdatePayload) {
      const route = '/setting';
      const response = await API.put<ISetting>(route, payload);
      return response.data;
    },
    ...props,
  });
}
