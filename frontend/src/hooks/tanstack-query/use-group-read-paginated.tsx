import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { groupListOptions } from './_query-options';

import type { IGroup, Paginated } from '@/lib/interfaces';
import type { BaseQueryPayload } from '@/lib/payloads';

export function useGroupReadPaginated(
  params?: BaseQueryPayload,
): UseQueryResult<Paginated<IGroup>, Error> {
  return useQuery(groupListOptions(params ?? { page: 1, perPage: 50 }));
}
