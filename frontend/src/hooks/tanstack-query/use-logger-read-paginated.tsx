import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { loggerListOptions } from './_query-options';

import type { ILogger, Paginated } from '@/lib/interfaces';
import type { LoggerQueryPayload } from '@/lib/payloads';

export function useLoggerReadPaginated(
  params?: LoggerQueryPayload,
): UseQueryResult<Paginated<ILogger>, Error> {
  return useQuery(loggerListOptions(params ?? { page: 1, perPage: 50 }));
}
