import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

import { userListInfiniteOptions } from './_query-options';

import type { IUser, Paginated } from '@/lib/interfaces';
import type { UserQueryPayload } from '@/lib/payloads';

export function useUserReadPaginatedInfinite(
  params?: UserQueryPayload,
): UseInfiniteQueryResult<InfiniteData<Paginated<IUser>>, Error> {
  return useInfiniteQuery(userListInfiniteOptions(params ?? {}));
}
