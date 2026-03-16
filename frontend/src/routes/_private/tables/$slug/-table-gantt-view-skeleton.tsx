import { Skeleton } from '@/components/ui/skeleton';

export function TableGanttViewSkeleton(): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-64 shrink-0 border-r p-2 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 w-full"
            />
          ))}
        </div>
        <div className="flex-1 p-2 space-y-2">
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 w-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
