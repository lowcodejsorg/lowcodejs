import { PageShell } from '@/components/common/page-shell';
import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton(): React.JSX.Element {
  return (
    <PageShell>
      <PageShell.Header>
        <Skeleton className="h-8 w-48" />
      </PageShell.Header>

      <PageShell.Content className="p-4 space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
      </PageShell.Content>

      <PageShell.Footer />
    </PageShell>
  );
}
