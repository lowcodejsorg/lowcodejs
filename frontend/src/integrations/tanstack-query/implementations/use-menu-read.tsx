import { API } from '@/lib/api';
import { IMenu } from '@/lib/interfaces';
import { useQuery } from '@tanstack/react-query';

export function useReadMenu(payload: { menuId: string }) {
  return useQuery({
    queryKey: ['/menu/'.concat(payload.menuId), payload.menuId],
    queryFn: async function () {
      const route = '/menu/'.concat(payload.menuId);
      const response = await API.get<IMenu>(route);
      return response.data;
    },
    enabled: Boolean(payload.menuId),
  });
}
