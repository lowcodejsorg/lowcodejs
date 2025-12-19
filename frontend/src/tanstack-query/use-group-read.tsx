import { API } from '@/lib/api';
import { IGroup } from '@/lib/interfaces';
import { useQuery } from '@tanstack/react-query';

export function useReadGroup(payload: { groupId: string }) {
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
