import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { menuDetailOptions } from './_query-options';

import type { IMenu } from '@/lib/interfaces';

export function useReadMenu(payload: {
  menuId: string;
}): UseQueryResult<IMenu> {
  return useQuery(menuDetailOptions(payload.menuId));
}
