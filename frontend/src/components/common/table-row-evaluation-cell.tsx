import { Star } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { useProfileRead } from '@/hooks/tanstack-query/use-profile-read';
import { useRowUpdateEvaluation } from '@/hooks/tanstack-query/use-row-update-evaluation';
import { handleApiError } from '@/lib/handle-api-error';
import type { IField, IRow } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

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
  const { data: user } = useProfileRead();

  const data = Array.from<Evaluation>(row[field.slug] ?? []);

  const userEvaluation = data.some(
    (d) => d.user._id.toString() === user?._id.toString(),
  );
  const userEvaluationValue = data.find(
    (d) => d.user._id.toString() === user?._id.toString(),
  )?.value;

  const average =
    data.length > 0
      ? data.reduce((acc, curr) => acc + curr.value, 0) / data.length
      : 0;

  const [hoverRating, setHoverRating] = React.useState(0);

  const evaluation = useRowUpdateEvaluation({
    onError(error) {
      handleApiError(error, { context: 'Erro ao avaliar' });
    },
  });

  const displayRating = userEvaluationValue ?? (hoverRating || average);

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
                evaluation.mutate({
                  tableSlug,
                  rowId: row._id,
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
