import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { rowDetailOptions } from './_query-options';

import type { IRow } from '@/lib/interfaces';

export function useReadTableRow(payload: {
  slug: string;
  rowId: string;
}): UseQueryResult<IRow> {
  return useQuery(rowDetailOptions(payload.slug, payload.rowId));
}
