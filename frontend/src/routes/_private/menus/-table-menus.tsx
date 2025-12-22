import { useRouter } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';

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
import { MENU_ITEM_TYPE } from '@/lib/constant';
import type { IMenu } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableMenusProps {
  data: Array<IMenu>;
}

const TypeMapper = {
  page: 'Página',
  table: 'Tabela',
  form: 'Formulário',
  external: 'Link Externo',
  separator: 'Separador',
};

function TableMenuRow({ menu }: { menu: IMenu }) {
  const sidebar = useSidebar();
  const router = useRouter();

  return (
    <TableRow
      key={menu._id}
      className="cursor-pointer"
      onClick={() => {
        sidebar.setOpen(false);
        router.navigate({
          to: '/menus/$menuId',
          params: {
            menuId: menu._id,
          },
        });
      }}
    >
      <TableCell className="font-medium">{menu.name}</TableCell>
      <TableCell className="text-muted-foreground">{menu.slug}</TableCell>
      <TableCell>
        <Badge
          className={cn(
            'font-semibold border-transparent',
            menu.type === MENU_ITEM_TYPE.PAGE && 'bg-green-100 text-green-700',
            menu.type === MENU_ITEM_TYPE.TABLE &&
              'bg-yellow-100 text-yellow-700',
            menu.type === MENU_ITEM_TYPE.FORM && 'bg-blue-100 text-blue-700',
            menu.type === MENU_ITEM_TYPE.EXTERNAL &&
              'bg-violet-100 text-violet-700',
            menu.type === MENU_ITEM_TYPE.SEPARATOR &&
              'bg-gray-100 text-gray-700',
          )}
        >
          {TypeMapper[menu.type as keyof typeof TypeMapper] || 'N/A'}
        </Badge>
      </TableCell>
      <TableCell className="w-20">
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

export function TableMenus({ data }: TableMenusProps) {
  const headers = ['Nome', 'Slug', 'Tipo'];

  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background z-10">
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={headers.length + 1}
              className="text-center py-8 text-muted-foreground"
            >
              Nenhum item de menu encontrado
            </TableCell>
          </TableRow>
        )}
        {data.map((menu) => (
          <TableMenuRow
            menu={menu}
            key={menu._id}
          />
        ))}
      </TableBody>
    </Table>
  );
}
