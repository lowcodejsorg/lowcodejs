import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { ISetupStatus } from '@/lib/interfaces';
import type { SetupPagingPayload } from '@/lib/payloads';

interface Props {
  onSuccess?: (data: ISetupStatus) => void;
  onError?: (error: unknown) => void;
}

export function useSetupSubmitPaging(
  props: Props = {},
): UseMutationResult<ISetupStatus, unknown, SetupPagingPayload, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SetupPagingPayload) => {
      const { data } = await API.put<ISetupStatus>(
        '/setup/step/paging',
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.setup.all });
      if (props.onSuccess) {
        props.onSuccess(data);
      }
    },
    onError: (error) => {
      if (props.onError) {
        props.onError(error);
      }
    },
  });
}
