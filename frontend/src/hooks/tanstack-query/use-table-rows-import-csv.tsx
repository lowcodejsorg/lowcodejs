import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { API } from '@/lib/api';

type ImportCsvParams = { slug: string; file: File };
type ImportCsvResult = { jobId: string };

export function useTableRowsImportCsv(): UseMutationResult<
  ImportCsvResult,
  Error,
  ImportCsvParams,
  unknown
> {
  return useMutation({
    mutationFn: async function ({
      slug,
      file,
    }: ImportCsvParams): Promise<ImportCsvResult> {
      const form = new FormData();
      form.append('file', file);
      const res = await API.post<ImportCsvResult>(
        `/tables/${slug}/rows/imports/csv`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return res.data;
    },
  });
}
