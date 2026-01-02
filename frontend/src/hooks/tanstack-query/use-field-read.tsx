import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IField } from '@/lib/interfaces';

interface UseFieldReadParams {
  tableSlug: string;
  fieldId: string;
}

export function useFieldRead(
  params: UseFieldReadParams,
): UseQueryResult<IField, Error> {
  return useQuery({
    queryKey: [
      `/tables/${params.tableSlug}/fields/${params.fieldId}`,
      params.fieldId,
    ],
    queryFn: async function () {
      const route = `/tables/${params.tableSlug}/fields/${params.fieldId}`;
      const response = await API.get<IField>(route);
      return response.data;
    },
    enabled: Boolean(params.tableSlug) && Boolean(params.fieldId),
  });
}
