import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TableDocumentViewSkeleton(): React.JSX.Element {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_220px] gap-6">
        {/* Sidebar esquerda */}
        <Card className="p-3 space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </Card>

        {/* Conteúdo central */}
        <Card className="p-6 space-y-6">
          {/* h1 */}
          <Skeleton className="h-8 w-2/3" />

          {/* Seções */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              {/* h2 */}
              <Skeleton className="h-5 w-1/3" />
              {/* parágrafo */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
            </div>
          ))}
        </Card>

        {/* TOC direita */}
        <Card className="p-3 space-y-3 hidden lg:block">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </Card>
      </div>
    </div>
  );
}
