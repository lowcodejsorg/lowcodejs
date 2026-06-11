import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';

export type StorageDriver = 'local' | 's3';
export type StorageMigrationFileStatus =
  | 'idle'
  | 'pending'
  | 'in_progress'
  | 'failed';

export type StorageMigrationStatus = {
  current_driver: StorageDriver;
  previous_driver: StorageDriver;
  total_files: number;
  by_location: Record<StorageDriver, number>;
  by_status: Record<StorageMigrationFileStatus, number>;
  migration_in_progress: boolean;
  active_job_id: string | null;
  last_run_at: string | null;
  can_cleanup: boolean;
};

type Response = { data: StorageMigrationStatus };

export function useStorageMigrationStatus(options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
}): UseQueryResult<StorageMigrationStatus> {
  return useQuery({
    queryKey: queryKeys.storageMigration.status(),
    queryFn: async () => {
      const response = await API.get<Response>('/storage/migration/status');
      return response.data.data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 10_000,
    staleTime: 0,
  });
}
