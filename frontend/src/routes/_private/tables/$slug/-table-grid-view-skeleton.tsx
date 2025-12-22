import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TableGridViewSkeleton(): React.JSX.Element {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, cardIndex) => (
          <Card
            key={cardIndex}
            className="overflow-hidden"
          >
            <CardContent className="p-3 space-y-3">
              {Array.from({ length: 4 }).map((_, fieldIndex) => (
                <div
                  key={fieldIndex}
                  className="flex flex-col gap-0.5"
                >
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </CardContent>
            <CardFooter className="p-3 pb-0">
              <Skeleton className="h-8 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
