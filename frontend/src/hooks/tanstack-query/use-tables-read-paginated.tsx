import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { tableListOptions } from './_query-options';

import type { ITable, Paginated } from '@/lib/interfaces';
import type { TableQueryPayload } from '@/lib/payloads';

export function useTablesReadPaginated(
  params?: TableQueryPayload,
): UseQueryResult<Paginated<ITable>, Error> {
  return useQuery(tableListOptions(params ?? { page: 1, perPage: 50 }));
}
