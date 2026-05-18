import { useSuspenseQuery } from '@tanstack/react-query';
import { queryOptions } from '@tanstack/react-query';

import { API } from '@/lib/api';

import { queryKeys } from './_query-keys';

export interface IDocResponseField {
  key: string;
  label: string;
  type: 'string' | 'date' | 'number' | 'boolean';
}

export interface IDocumentType {
  id: string;
  name: string;
  description: string | null;
  responseFields: IDocResponseField[];
}

export interface IDocTranscriptionConfig {
  apiUrl: string | null;
  apiKey: string | null;
  model: string | null;
  documentTypes: IDocumentType[];
}

export const docTranscriptionConfigOptions = () =>
  queryOptions({
    queryKey: queryKeys.docTranscription.config(),
    queryFn: async () => {
      const response = await API.get<IDocTranscriptionConfig>(
        '/tools/doc-transcription/config',
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export function useDocTranscriptionConfig() {
  return useSuspenseQuery(docTranscriptionConfigOptions());
}
