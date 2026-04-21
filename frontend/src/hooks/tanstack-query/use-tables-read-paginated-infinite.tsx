import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

import { tableListInfiniteOptions } from './_query-options';

import type { ITable, Paginated } from '@/lib/interfaces';
import type { TableQueryPayload } from '@/lib/payloads';

export function useTablesReadPaginatedInfinite(
  params?: TableQueryPayload,
): UseInfiniteQueryResult<InfiniteData<Paginated<ITable>>, Error> {
  return useInfiniteQuery(tableListInfiniteOptions(params ?? {}));
}
