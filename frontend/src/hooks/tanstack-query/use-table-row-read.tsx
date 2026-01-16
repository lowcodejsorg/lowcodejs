import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';

export function useReadTableRow(payload: {
  slug: string;
  rowId: string;
}): UseQueryResult<IRow> {
  const route = '/tables/'
    .concat(payload.slug)
    .concat('/rows/')
    .concat(payload.rowId);

  return useQuery({
    queryKey: [route, payload.rowId],
    queryFn: async function () {
      const response = await API.get<IRow>(route);
      return response.data;
    },
    enabled: Boolean(payload.slug) && Boolean(payload.rowId),
  });
}
