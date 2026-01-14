import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { ISetting } from '@/lib/interfaces';
import type { SettingUpdatePayload } from '@/lib/payloads';

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

export function useUpdateSetting(
  props: UseSettingUpdateProps,
): UseMutationResult<
  ISetting,
  AxiosError | Error,
  SettingUpdatePayload,
  unknown
> {
  return useMutation({
    mutationFn: async function (payload: SettingUpdatePayload) {
      const route = '/setting';
      const response = await API.put<ISetting>(route, payload);
      return response.data;
    },
    ...props,
  });
}
