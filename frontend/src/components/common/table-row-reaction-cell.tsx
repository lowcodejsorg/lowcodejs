import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-profile';
import { API } from '@/lib/api';
import type { IField, IRow, Paginated } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Reaction {
  type: 'like' | 'unlike';
  user: { _id: string };
}

interface TableRowReactionCellProps {
  row: IRow;
  field: IField;
  tableSlug: string;
}

export function TableRowReactionCell({
  field,
  row,
  tableSlug,
}: TableRowReactionCellProps): React.JSX.Element {
  const { data: user } = useProfile();

  const data = Array.from<Reaction>(row[field.slug] ?? []);

  const totalLike = data.filter((d) => d.type === 'like').length;
  const totalUnlike = data.filter((d) => d.type === 'unlike').length;

  const userLike = data.some(
    (d) => d.type === 'like' && d.user?._id?.toString() === user?._id?.toString(),
  );

  const userUnlike = data.some(
    (d) => d.type === 'unlike' && d.user?._id?.toString() === user?._id?.toString(),
  );

  const search = useSearch({
    strict: false,
  });

  const reaction = useMutation({
    mutationFn: async function (payload: {
      user: string;
      field: string;
      type: Reaction['type'];
    }) {
      const route = '/tables/'
        .concat(tableSlug)
        .concat('/rows/')
        .concat(row._id)
        .concat('/reaction');
      const response = await API.post<IRow>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      QueryClient.setQueryData<Paginated<IRow[]>>(
        ['/tables/'.concat(tableSlug).concat('/rows/paginated'), tableSlug, search],
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((item) => (item._id === data._id ? data : item)),
          };
        },
      );
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;
        if (data?.message) {
          toast.error(data.message);
        }
      }
      console.error(error);
    },
  });

  return (
    <div className="inline-flex gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (!user?._id) return;
          reaction.mutateAsync({
            user: user._id.toString(),
            field: field.slug,
            type: 'like',
          });
        }}
      >
        <ThumbsUpIcon
          className={cn('size-4', userLike && 'fill-primary text-primary')}
        />
        <span className="font-medium">{totalLike}</span>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (!user?._id) return;
          reaction.mutateAsync({
            user: user._id.toString(),
            field: field.slug,
            type: 'unlike',
          });
        }}
      >
        <ThumbsDownIcon
          className={cn('size-4', userUnlike && 'fill-destructive text-destructive')}
        />
        <span className="font-medium">{totalUnlike}</span>
      </Button>
    </div>
  );
}
