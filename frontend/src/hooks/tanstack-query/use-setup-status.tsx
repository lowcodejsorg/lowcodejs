import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { setupStatusOptions } from './_query-options';

import type { ISetupStatus } from '@/lib/interfaces';

export function useSetupStatus(): UseQueryResult<ISetupStatus> {
  return useQuery(setupStatusOptions());
}
