import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TableMosaicViewSkeleton(): React.JSX.Element {
  return (
    <div className="p-4 [column-gap:16px] columns-1 sm:columns-2 lg:columns-3 xl:columns-4">
      {Array.from({ length: 12 }).map((_, i) => {
        const imgHeight = 120 + (i % 5) * 30; // variação tipo Pinterest

        return (
          <Card
            key={i}
            className="mb-4 break-inside-avoid overflow-hidden"
          >
            <Skeleton
              className="w-full"
              style={{ height: imgHeight }}
            />

            <CardContent className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
