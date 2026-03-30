import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function TableListViewSkeleton(): React.JSX.Element {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          {Array.from({ length: 4 }).map((_, index) => (
            <TableHead
              key={index}
              className="w-auto"
            >
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
          <TableHead className="w-30">
            <Skeleton className="size-6" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: 4 }).map((_unused, cellIndex) => (
              <TableCell key={cellIndex}>
                <Skeleton className="h-4 w-32" />
              </TableCell>
            ))}
            <TableCell>
              <Skeleton className="size-6" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
