import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { userListOptions } from './_query-options';

import type { IUser, Paginated } from '@/lib/interfaces';
import type { BaseQueryPayload } from '@/lib/payloads';

export function useUserReadPaginated(
  params?: BaseQueryPayload,
): UseQueryResult<Paginated<IUser>, Error> {
  return useQuery(userListOptions(params ?? { page: 1, perPage: 50 }));
}
