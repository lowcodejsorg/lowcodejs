import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const HEADERS = [
  'Tabela',
  'Link (slug)',
  'Visibilidade',
  'Criado por',
  'Criado em',
];

export function TableTablesSkeleton(): React.JSX.Element {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          {HEADERS.map((label) => (
            <TableHead key={label}>
              <span>{label}</span>
            </TableHead>
          ))}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell className="flex items-center space-x-2">
              <Skeleton className="size-10 rounded-md" />
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-36" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-36" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8 rounded-md" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
