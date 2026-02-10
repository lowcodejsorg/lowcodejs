import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IField } from '@/lib/interfaces';

import { queryKeys } from './_query-keys';

interface UseFieldReadParams {
  tableSlug: string;
  fieldId: string;
  groupSlug?: string;
}

export function useFieldRead(
  params: UseFieldReadParams,
): UseQueryResult<IField, Error> {
  return useQuery({
    queryKey: queryKeys.fields.detail(params.tableSlug, params.fieldId, params.groupSlug),
    queryFn: async function () {
      let route = `/tables/${params.tableSlug}/fields/${params.fieldId}`;
      if (params.groupSlug) {
        route = route.concat('?group=').concat(params.groupSlug);
      }
      const response = await API.get<IField>(route);
      return response.data;
    },
    enabled: Boolean(params.tableSlug) && Boolean(params.fieldId),
  });
}
