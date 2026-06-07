import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { API } from '@/lib/api';

export interface ParceriasTtDashboardStats {
  totals: {
    demands: number;
    withTransfer: number;
    withoutTransfer: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  status: Array<{
    label: string;
    value: number;
    percent: number;
    fill: string;
  }>;
  yearly: Array<{
    year: string;
    withoutTransfer: number;
    withTransfer: number;
  }>;
}

export interface ParceriasTtDashboardRow {
  id: string;
  legacyId: string;
  date: string | null;
  title: string;
  status: string;
}

export interface ParceriasTtDashboardRows {
  status: string;
  total: number;
  rows: ParceriasTtDashboardRow[];
}

interface UseParceriasTtDashboardStatsParams {
  startDate: string;
  endDate: string;
}

export type ParceriasTtDashboardRowsTransfer =
  | 'withTransfer'
  | 'withoutTransfer';

interface UseParceriasTtDashboardRowsParams extends UseParceriasTtDashboardStatsParams {
  status: string | null;
  year?: string | null;
  transfer?: ParceriasTtDashboardRowsTransfer | null;
  open: boolean;
}

export function useParceriasTtDashboardStats({
  startDate,
  endDate,
}: UseParceriasTtDashboardStatsParams): UseQueryResult<
  ParceriasTtDashboardStats,
  Error
> {
  return useQuery({
    queryKey: [
      'extensions',
      'apps',
      'parcerias-tt-dashboard',
      'stats',
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const response = await API.get<ParceriasTtDashboardStats>(
        '/e/apps/parcerias-tt-dashboard/stats',
        {
          params: {
            startDate: new Date(`${startDate}T00:00:00`).toISOString(),
            endDate: new Date(`${endDate}T23:59:59`).toISOString(),
          },
        },
      );
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useParceriasTtDashboardRows({
  startDate,
  endDate,
  status,
  year,
  transfer,
  open,
}: UseParceriasTtDashboardRowsParams): UseQueryResult<
  ParceriasTtDashboardRows,
  Error
> {
  return useQuery({
    queryKey: [
      'extensions',
      'apps',
      'parcerias-tt-dashboard',
      'rows',
      startDate,
      endDate,
      status,
      year,
      transfer,
    ],
    queryFn: async () => {
      const response = await API.get<ParceriasTtDashboardRows>(
        '/e/apps/parcerias-tt-dashboard/rows',
        {
          params: {
            startDate: new Date(`${startDate}T00:00:00`).toISOString(),
            endDate: new Date(`${endDate}T23:59:59`).toISOString(),
            status: status ?? undefined,
            year: year ?? undefined,
            transfer: transfer ?? undefined,
          },
        },
      );
      return response.data;
    },
    enabled: open && (Boolean(status) || Boolean(transfer)),
    staleTime: 60 * 1000,
  });
}
