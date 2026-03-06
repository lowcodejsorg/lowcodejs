import type {
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { queryKeys } from './_query-keys';

import { API } from '@/lib/api';
import type { IField, IRow, ITable, Paginated } from '@/lib/interfaces';

type FieldCreatePayload = Partial<IField> & {
  group?: { slug: string } | string | null;
};

interface UseFieldCreateProps extends Pick<
  Omit<
    UseMutationOptions<IField, AxiosError | Error, FieldCreatePayload>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> {
  slug: string;
  groupSlug?: string;
  onSuccess?: (data: IField) => void;
}

export function useFieldCreate(
  props: UseFieldCreateProps,
): UseMutationResult<IField, AxiosError | Error, FieldCreatePayload> {
  const queryClient = useQueryClient();
  const { slug, groupSlug } = props;
  const isGroupContext = !!groupSlug;

  return useMutation({
    mutationFn: async (payload: FieldCreatePayload) => {
      const route = '/tables/'.concat(slug).concat('/fields');
      const response = await API.post<IField>(route, payload);
      return response.data;
    },
    onSuccess(response) {
      queryClient.setQueryData<ITable>(queryKeys.tables.detail(slug), (old) => {
        if (!old) return old;

        if (isGroupContext && groupSlug) {
          return {
            ...old,
            groups: old.groups.map((g) =>
              g.slug === groupSlug
                ? { ...g, fields: [...g.fields, response] }
                : g,
            ),
          };
        }

        return {
          ...old,
          fields: [...old.fields, response],
          fieldOrderForm: [...(old.fieldOrderForm ?? []), response.slug],
          fieldOrderList: [...(old.fieldOrderList ?? []), response.slug],
        };
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.tables.lists(),
      });

      if (!isGroupContext) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rows.lists(slug),
        });
      }

      props.onSuccess?.(response);
    },
    onError: props.onError,
  });
}
