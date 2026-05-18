import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API } from '@/lib/api';

import { queryKeys } from './_query-keys';
import type { IDocTranscriptionConfig } from './use-doc-transcription-config';

interface UpdateConfigPayload {
  apiUrl?: string | null;
  documentTypes?: IDocTranscriptionConfig['documentTypes'];
}

interface Options {
  onSuccess?: (data: IDocTranscriptionConfig) => void;
  onError?: (error: unknown) => void;
}

export function useDocTranscriptionConfigUpdate(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateConfigPayload) => {
      const response = await API.patch<IDocTranscriptionConfig>(
        '/tools/doc-transcription/config',
        payload,
      );
      return response.data;
    },
    onSuccess(data) {
      queryClient.setQueryData(queryKeys.docTranscription.config(), data);
      options?.onSuccess?.(data);
    },
    onError(error) {
      options?.onError?.(error);
    },
  });
}
