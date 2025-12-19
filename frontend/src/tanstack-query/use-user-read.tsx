import { API } from '@/lib/api';
import { IUser } from '@/lib/interfaces';
import { useQuery } from '@tanstack/react-query';

export function useReadUser(payload: { userId: string }) {
  return useQuery({
    queryKey: ['/users/'.concat(payload.userId), payload.userId],
    queryFn: async function () {
      const route = '/users/'.concat(payload.userId);
      const response = await API.get<IUser>(route);
      return response.data;
    },
    enabled: Boolean(payload.userId),
  });
}
