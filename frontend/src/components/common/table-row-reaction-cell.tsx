import { AxiosError } from 'axios';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useProfileRead } from '@/hooks/tanstack-query/use-profile-read';
import { useRowUpdateReaction } from '@/hooks/tanstack-query/use-row-update-reaction';
import { E_REACTION_TYPE } from '@/lib/constant';
import type { IField, IRow, ValueOf } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface Reaction {
  type: ValueOf<typeof E_REACTION_TYPE>;
  user?: { _id: string };
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
  const { data: user } = useProfileRead();

  const data = Array.from<Reaction>(row[field.slug] ?? []);

  const totalLike = data.filter((d) => d.type === E_REACTION_TYPE.LIKE).length;
  const totalUnlike = data.filter(
    (d) => d.type === E_REACTION_TYPE.UNLIKE,
  ).length;

  const userLike = data.some(
    (d) =>
      d.type === E_REACTION_TYPE.LIKE &&
      d.user?._id.toString() === user?._id.toString(),
  );

  const userUnlike = data.some(
    (d) =>
      d.type === E_REACTION_TYPE.UNLIKE &&
      d.user?._id.toString() === user?._id.toString(),
  );

  const reaction = useRowUpdateReaction({
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        if (errorData?.message) {
          toast.error(errorData.message);
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
          reaction.mutate({
            tableSlug,
            rowId: row._id,
            field: field.slug,
            type: E_REACTION_TYPE.LIKE,
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
          reaction.mutate({
            tableSlug,
            rowId: row._id,
            field: field.slug,
            type: E_REACTION_TYPE.UNLIKE,
          });
        }}
      >
        <ThumbsDownIcon
          className={cn(
            'size-4',
            userUnlike && 'fill-destructive text-destructive',
          )}
        />
        <span className="font-medium">{totalUnlike}</span>
      </Button>
    </div>
  );
}
