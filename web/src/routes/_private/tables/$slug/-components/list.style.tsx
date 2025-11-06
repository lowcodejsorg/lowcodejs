import { Button } from "@/components/ui/button";
import {
  Table as BaseTabela,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Field, Row } from "@/lib/entity";
import { useLocation } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import React from "react";
import { ActionMenu } from "./action.menu";
import { FieldTableCreateSheet } from "./field-table-create-sheet";
import { ListHeadCell } from "./list-head-cell";
import { ListRowCell } from "./list-row-cell";
// import { CelulaRegistro } from "./celula-registro";

interface Props {
  data: Row[];
  headers: Field[];
  order: string[];
}

export function List({ data, headers, order }: Props): React.ReactElement {
  const location = useLocation();

  const isPublicPage = location.pathname.startsWith("/public/tables/");

  const createTableFieldButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  return (
    <BaseTabela>
      {headers?.length > 0 && (
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            {headers
              ?.sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id))
              ?.filter((f) => f?.configuration?.listing && !f?.trashed)
              ?.map((field) => (
                <ListHeadCell field={field} key={field._id} />
              ))}

            <TableHead className="w-[120px]">
              <Button
                variant="outline"
                className="cursor-pointer size-6"
                onClick={() => {
                  createTableFieldButtonRef?.current?.click();
                }}
              >
                <PlusIcon className="size-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {data?.map((row) => {
          return (
            <TableRow key={row._id}>
              {headers
                ?.sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id))
                ?.filter((f) => f?.configuration?.listing && !f?.trashed)
                ?.map((field) => (
                  <ListRowCell
                    field={field}
                    row={row}
                    key={field._id?.concat("-").concat(field._id)}
                  />
                ))}

              {!isPublicPage && (
                <TableCell className="w-[80px]">
                  <ActionMenu row={row} />
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>

      <FieldTableCreateSheet ref={createTableFieldButtonRef} />
    </BaseTabela>
  );
}
