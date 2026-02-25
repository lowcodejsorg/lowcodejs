import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { pageDetailOptions } from './_query-options';

import type { IMenu } from '@/lib/interfaces';

export function usePageRead(payload: {
  slug: string;
}): UseQueryResult<IMenu, Error> {
  return useQuery(pageDetailOptions(payload.slug));
}
