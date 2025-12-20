import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IGroup } from '@/lib/interfaces';
import { useRouter } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import React from 'react';

interface Props {
  data: IGroup[];
  headers: string[];
}

function TableGroupRow({ group }: { group: IGroup }) {
  const sidebar = useSidebar();
  const router = useRouter();

  return (
    <TableRow
      key={group._id}
      className="cursor-pointer"
      onClick={() => {
        sidebar.setOpen(false);
        router.navigate({
          to: '/groups/$groupId',
          params: {
            groupId: group._id,
          },
        });
      }}
    >
      <TableCell>{group.name}</TableCell>
      <TableCell>
        <Badge variant="outline">{group.slug}</Badge>
      </TableCell>
      <TableCell className="truncate max-w-xs">
        {group.description || 'N/A'}
      </TableCell>

      <TableCell>
        <Button
          variant="ghost"
          size="icon-sm"
        >
          <ArrowRightIcon />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function TableGroups({ data, headers }: Props): React.ReactElement {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow className="">
          {headers?.map((head) => (
            <TableHead key={head}>
              <span>{head}</span>
            </TableHead>
          ))}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((group) => (
          <TableGroupRow
            group={group}
            key={group._id}
          />
        ))}
      </TableBody>
    </Table>
  );
}
