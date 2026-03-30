import { Spinner } from '@/components/ui/spinner';

export function TableSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner className="size-8" />
    </div>
  );
}
