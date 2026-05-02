import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { downloadCsvFromApi } from '@/lib/csv-export';

export type CsvExportParams = Record<string, unknown> | undefined;

type UseCsvExportProps = Pick<
  Omit<
    UseMutationOptions<void, AxiosError | Error, CsvExportParams, unknown>,
    'mutationFn'
  >,
  'onError' | 'onSuccess'
>;

/**
 * Hook factory para exportação CSV. Encapsula:
 * - Chamada axios com `responseType: 'blob'`
 * - Download via `downloadBlob` respeitando `Content-Disposition`
 * - Conversão de erro Blob → JSON para que `handleApiError` consiga ler `cause`/`message`
 */
export function useCsvExport(
  endpoint: string,
  fallbackFilename = 'export.csv',
  props: UseCsvExportProps = {},
): UseMutationResult<void, AxiosError | Error, CsvExportParams, unknown> {
  return useMutation({
    mutationFn: async function (params: CsvExportParams) {
      try {
        await downloadCsvFromApi(endpoint, params ?? {}, fallbackFilename);
      } catch (error) {
        if (
          error instanceof AxiosError &&
          error.response?.data instanceof Blob
        ) {
          try {
            const text = await error.response.data.text();
            error.response.data = JSON.parse(text);
          } catch {
            // mantém blob original — handleApiError caira no fallback genérico
          }
        }
        throw error;
      }
    },
    onError: props.onError,
    onSuccess: props.onSuccess,
  });
}
