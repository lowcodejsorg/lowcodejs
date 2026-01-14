import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TableCardViewSkeleton(): React.JSX.Element {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card
          key={i}
          className="overflow-hidden"
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-[140px] h-[105px] rounded-xl shrink-0" />

              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {Array.from({ length: 4 }).map((_unused, j) => (
                    <div
                      key={j}
                      className="flex flex-col gap-1"
                    >
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
