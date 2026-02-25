import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { groupAllOptions } from './_query-options';

import type { IGroup } from '@/lib/interfaces';

export function useGroupReadList(): UseQueryResult<Array<IGroup>, Error> {
  return useQuery(groupAllOptions());
}
