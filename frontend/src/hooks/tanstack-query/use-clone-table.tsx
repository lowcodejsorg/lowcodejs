import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { ICloneTableResponse } from '@/lib/interfaces';
import type { CloneTablePayload } from '@/lib/payloads';

type UseCloneTableProps = Pick<
  Omit<
    UseMutationOptions<
      ICloneTableResponse,
      AxiosError | Error,
      CloneTablePayload,
      unknown
    >,
    'mutationFn'
  >,
  'onSuccess' | 'onError'
>;

export function useCloneTable(
  props: UseCloneTableProps,
): UseMutationResult<
  ICloneTableResponse,
  AxiosError | Error,
  CloneTablePayload,
  unknown
> {
  return useMutation({
    mutationFn: async function (payload: CloneTablePayload) {
      const route = '/tools/clone-table';
      const response = await API.post<ICloneTableResponse>(route, payload);
      return response.data;
    },
    ...props,
  });
}
