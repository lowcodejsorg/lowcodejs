import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-profile';
import { API } from '@/lib/api';
import type { IField, IRow, Paginated } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { Star } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

interface Evaluation {
  value: number;
  user: { _id: string };
}

interface TableRowEvaluationCellProps {
  size?: number;
  disabled?: boolean;
  className?: string;
  row: IRow;
  field: IField;
  tableSlug: string;
}

const MAX_RATING = 5;

export function TableRowEvaluationCell({
  size = 16,
  disabled = false,
  className,
  row,
  field,
  tableSlug,
}: TableRowEvaluationCellProps): React.JSX.Element {
  const { data: user } = useProfile();

  const data = Array.from<Evaluation>(row[field.slug] ?? []);

  const userEvaluation = data.some(
    (d) => d.user?._id?.toString() === user?._id?.toString(),
  );
  const userEvaluationValue = data.find(
    (d) => d.user?._id?.toString() === user?._id?.toString(),
  )?.value;

  const average =
    data.length > 0
      ? data.reduce((acc, curr) => acc + curr.value, 0) / data.length
      : 0;

  const [hoverRating, setHoverRating] = React.useState(0);

  const search = useSearch({
    strict: false,
  });

  const evaluation = useMutation({
    mutationFn: async function (payload: {
      user: string;
      field: string;
      value: number;
    }) {
      const route = '/tables/'
        .concat(tableSlug)
        .concat('/rows/')
        .concat(row._id)
        .concat('/evaluation');
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

  const displayRating = userEvaluationValue ?? hoverRating ?? average;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        {Array.from({ length: MAX_RATING }, (_, index) => {
          const value = index + 1;
          const isFilled = userEvaluation && value <= displayRating;

          return (
            <Button
              size="sm"
              variant="ghost"
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!user?._id) return;
                evaluation.mutateAsync({
                  user: user._id.toString(),
                  field: field.slug,
                  value,
                });
              }}
              onMouseEnter={() => !disabled && setHoverRating(value)}
              onMouseLeave={() => !disabled && setHoverRating(0)}
              disabled={disabled}
              className={cn(
                'p-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm',
                disabled && 'cursor-not-allowed opacity-50',
                !disabled && 'cursor-pointer hover:scale-110',
              )}
            >
              <Star
                size={size}
                className={cn(
                  'transition-colors',
                  isFilled && 'fill-yellow-400 text-yellow-400',
                  !isFilled && 'fill-none text-gray-300 hover:text-yellow-400',
                )}
              />
            </Button>
          );
        })}
      </div>

      <span className="text-sm font-medium text-muted-foreground">
        {average.toFixed(1)}
      </span>
    </div>
  );
}
