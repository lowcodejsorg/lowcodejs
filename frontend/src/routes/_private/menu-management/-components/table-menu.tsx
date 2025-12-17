import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Menu } from "@/lib/entity";
import { EllipsisIcon, PencilIcon, TrashIcon } from "lucide-react";
import React from "react";
import { DialogMenuDelete } from "./dialog-menu-delete";
import { SheetMenuUpdate } from "./sheet-menu-update";

const LabelMapper: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  table: { label: "Tabela", variant: "default" },
  page: { label: "Página", variant: "secondary" },
  form: { label: "Formulário", variant: "outline" },
  external: { label: "Link Externo", variant: "destructive" },
};

interface TableMenuProps {
  headers: string[];
  data: Menu[];
}

function TableMenuRow({ menu }: { menu: Menu }) {
  const sheetMenuUpdateButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const dialogMenuDeleteRef = React.useRef<HTMLButtonElement | null>(null);

  const typeInfo = LabelMapper[menu.type] || {
    label: menu.type,
    variant: "default" as const,
  };

  return (
    <TableRow key={menu._id}>
      <TableCell className="font-medium">{menu.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {menu.slug}
      </TableCell>
      <TableCell>
        <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
      </TableCell>
      <TableCell className="w-[80px]">
        <DropdownMenu dir="ltr" modal={false}>
          <DropdownMenuTrigger className="p-1 rounded-full">
            <EllipsisIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-10">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                sheetMenuUpdateButtonRef?.current?.click();
              }}
            >
              <PencilIcon className="size-4" />
              <span>Editar</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="inline-flex space-x-1 w-full text-destructive"
              onClick={() => {
                dialogMenuDeleteRef?.current?.click();
              }}
            >
              <TrashIcon className="size-4" />
              <span>Deletar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SheetMenuUpdate ref={sheetMenuUpdateButtonRef} _id={menu._id} />
        <DialogMenuDelete ref={dialogMenuDeleteRef} _id={menu._id} />
      </TableCell>
    </TableRow>
  );
}

export function TableMenu({ headers, data }: TableMenuProps) {
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
          <TableMenuRow menu={menu} key={menu._id} />
        ))}
      </TableBody>
    </Table>
  );
}
