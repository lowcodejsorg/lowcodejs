import { Skeleton } from '@/components/ui/skeleton';

export function TableCalendarViewSkeleton(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-[72px_repeat(7,minmax(0,1fr))]">
        {Array.from({ length: 8 }).map((_, col) => (
          <div
            key={col}
            className="border-r"
          >
            {Array.from({ length: 8 }).map((__, row) => (
              <Skeleton
                key={row}
                className="m-1 h-12 rounded-md"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
