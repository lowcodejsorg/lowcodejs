import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';

import { queryKeys } from './_query-keys';

export function useReadTableRow(payload: {
  slug: string;
  rowId: string;
}): UseQueryResult<IRow> {
  const route = '/tables/'
    .concat(payload.slug)
    .concat('/rows/')
    .concat(payload.rowId);

  return useQuery({
    queryKey: queryKeys.rows.detail(payload.slug, payload.rowId),
    queryFn: async function () {
      const response = await API.get<IRow>(route);
      return response.data;
    },
    enabled: Boolean(payload.slug) && Boolean(payload.rowId),
  });
}
