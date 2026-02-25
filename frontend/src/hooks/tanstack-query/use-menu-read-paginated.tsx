import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { menuListOptions } from './_query-options';

import type { IMenu, Paginated } from '@/lib/interfaces';
import type { BaseQueryPayload } from '@/lib/payloads';

export function useMenuReadPaginated(
  params?: BaseQueryPayload,
): UseQueryResult<Paginated<IMenu>, Error> {
  return useQuery(menuListOptions(params ?? { page: 1, perPage: 50 }));
}
