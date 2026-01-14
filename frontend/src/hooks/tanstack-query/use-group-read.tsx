import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IGroup } from '@/lib/interfaces';

export function useReadGroup(payload: {
  groupId: string;
}): UseQueryResult<IGroup> {
  return useQuery({
    queryKey: ['/user-group/'.concat(payload.groupId), payload.groupId],
    queryFn: async function () {
      const route = '/user-group/'.concat(payload.groupId);
      const response = await API.get<IGroup>(route);
      return response.data;
    },
    enabled: Boolean(payload.groupId),
  });
}
