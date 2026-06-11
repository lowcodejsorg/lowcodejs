import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { downloadCsvFromApi } from '@/lib/csv-export';

type ExportGroupRowsParams = {
  slug: string;
  rowId: string;
  groupSlug: string;
};

type Props = Pick<
  Omit<
    UseMutationOptions<
      void,
      AxiosError | Error,
      ExportGroupRowsParams,
      unknown
    >,
    'mutationFn'
  >,
  'onError' | 'onSuccess'
>;

export function useGroupRowsExportCsv(
  props: Props = {},
): UseMutationResult<void, AxiosError | Error, ExportGroupRowsParams, unknown> {
  return useMutation({
    mutationFn: async function ({
      slug,
      rowId,
      groupSlug,
    }: ExportGroupRowsParams) {
      try {
        await downloadCsvFromApi(
          `/tables/${slug}/rows/${rowId}/groups/${groupSlug}/exports/csv`,
          {},
          `tabela-${slug}-grupo-${groupSlug}.csv`,
        );
      } catch (error) {
        if (
          error instanceof AxiosError &&
          error.response?.data instanceof Blob
        ) {
          try {
            const text = await error.response.data.text();
            error.response.data = JSON.parse(text);
          } catch {
            // ignore
          }
        }
        throw error;
      }
    },
    onError: props.onError,
    onSuccess: props.onSuccess,
  });
}
