import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';
import type { ProfileUpdatePayload } from '@/lib/payloads';

import { queryKeys } from './_query-keys';

type UseProfileUpdateProps = Pick<
  Omit<
    UseMutationOptions<
      IUser,
      AxiosError | Error,
      ProfileUpdatePayload,
      unknown
    >,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IUser, variables: ProfileUpdatePayload) => void;
};

export function useUpdateProfile(
  props: UseProfileUpdateProps,
): UseMutationResult<IUser, AxiosError | Error, ProfileUpdatePayload, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: ProfileUpdatePayload) {
      const route = '/profile';
      const response = await API.put<IUser>(route, payload);
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
