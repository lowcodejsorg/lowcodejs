import { Skeleton } from '@/components/ui/skeleton';

export function TableForumViewSkeleton(): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <aside className="w-64 shrink-0 border-r p-3 space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-6 w-full"
            />
          ))}
        </div>
      </aside>
      <section className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 border-b p-3">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex gap-3"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
