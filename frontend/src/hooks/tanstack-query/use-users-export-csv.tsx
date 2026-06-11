import type { UseMutationResult } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { useCsvExport } from './use-csv-export';
import type { CsvExportParams } from './use-csv-export';

type Props = {
  onError?: (error: AxiosError | Error) => void;
  onSuccess?: () => void;
};

export function useUsersExportCsv(
  props: Props = {},
): UseMutationResult<void, AxiosError | Error, CsvExportParams, unknown> {
  return useCsvExport('/users/exports/csv', 'usuarios.csv', props);
}
