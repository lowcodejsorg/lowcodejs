import { Skeleton } from '@/components/ui/skeleton';

export function TableKanbanViewSkeleton(): React.JSX.Element {
  return (
    <div className="flex gap-4 h-full overflow-x-auto p-2">
      {Array.from({ length: 4 }).map((__, index) => (
        <div
          key={index}
          className="w-72 shrink-0 space-y-3"
        >
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }).map((___, cardIndex) => (
            <Skeleton
              key={cardIndex}
              className="h-32 w-full"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
