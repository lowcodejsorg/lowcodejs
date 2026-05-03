import { useCallback } from 'react';

import type { MentionItem } from '@/components/common/rich-editor/bubble/mention-list';
import { API } from '@/lib/api';
import { E_USER_STATUS } from '@/lib/constant';
import type { IUser, Paginated } from '@/lib/interfaces';

export interface UseUserMentionSearch {
  resolveItems: (query: string) => Promise<Array<MentionItem>>;
}

export function useUserMentionSearch(): UseUserMentionSearch {
  const resolveItems = useCallback(
    async (query: string): Promise<Array<MentionItem>> => {
      const trimmed = query.trim();
      const params: Record<string, unknown> = {
        page: 1,
        perPage: 10,
        status: E_USER_STATUS.ACTIVE,
      };
      if (trimmed.length > 0) params.search = trimmed;
      const response = await API.get<Paginated<IUser>>('/users/paginated', {
        params,
      });
      return response.data.data.map((user) => ({
        id: String(user._id ?? ''),
        label: user.name || user.email || 'Usuário',
        email: user.email,
      }));
    },
    [],
  );

  return { resolveItems };
}
