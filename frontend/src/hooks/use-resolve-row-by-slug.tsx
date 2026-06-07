import { useQuery } from '@tanstack/react-query';

import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import { Paginated } from '@/lib/interfaces';

export function useResolveRowBySlug(
  slug: string,
  rowSlug: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['rows', 'by-slug', slug, rowSlug],
    queryFn: async () => {
      const response = await API.get<IRow>(
        `/tables/${slug}/rows/by-slug/${rowSlug}`,
      );
      return response.data;
    },
    enabled: enabled && Boolean(slug) && Boolean(rowSlug),
    staleTime: 30 * 1000,
  });
}
