import { Link } from '@tanstack/react-router';
import { FileIcon } from 'lucide-react';

import type { IField, IRow, IStorage } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableRowFileCellProps {
  row: IRow;
  field: IField;
  isGallery?: boolean;
  isCardOrMosaic?: boolean;
}

export function TableRowFileCell({
  field,
  row,
  isGallery = false,
  isCardOrMosaic = false,
}: TableRowFileCellProps): React.JSX.Element {
  const values = Array.from<IStorage>(row[field.slug] ?? []);

  if (values.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <ul className={cn('space-y-1', isGallery && 'grid grid-cols-4 gap-1')}>
      {values.map((value) => {
        const isImage = value.type.includes('image');

        if ((isGallery || isCardOrMosaic) && isImage) {
          return (
            <li key={value._id}>
              <Link
                to={value.url}
                target="_blank"
                className="flex flex-col items-center gap-1 text-center underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={value.url}
                  alt={value.originalName}
                  className={cn("object-cover", isCardOrMosaic ? "size-full h-full" : "size-16")}
                />
                { !isCardOrMosaic && (
                  <span className="text-xs text-center">
                    {value.originalName}
                  </span>)
                }
              </Link>
            </li>
          );
        }

        if ((isGallery || isCardOrMosaic) && !isImage) {
          return (
            <li key={value._id}>
              <Link
                to={value.url}
                target="_blank"
                className="flex flex-col items-center gap-1 text-center underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                <FileIcon
                  className="size-16 text-muted-foreground"
                  strokeWidth={1}
                />
                <span className="text-xs text-center">
                  {value.originalName}
                </span>
              </Link>
            </li>
          );
        }

        return (
          <li key={value._id}>
            <Link
              to={value.url}
              target="_blank"
              className="text-sm text-primary underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              {value.originalName}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
