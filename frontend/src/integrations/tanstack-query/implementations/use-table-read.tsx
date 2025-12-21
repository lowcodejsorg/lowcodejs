import { API } from '@/lib/api';
import { ITable } from '@/lib/interfaces';
import { useQuery } from '@tanstack/react-query';

export function useReadTable(payload: { slug: string }) {
  return useQuery({
    queryKey: ['/tables/'.concat(payload.slug), payload.slug],
    queryFn: async function () {
      const route = '/tables/'.concat(payload.slug);
      const response = await API.get<ITable>(route);
      return response.data;
    },
    enabled: Boolean(payload.slug),
  });
}
