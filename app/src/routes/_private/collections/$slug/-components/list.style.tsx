import {
  Table as BaseTabela,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Field, Row } from "@/lib/entity";
import React from "react";
import { ActionMenu } from "./action.menu";
import { ListHeadCell } from "./list-head-cell";
import { ListRowCell } from "./list-row-cell";
// import { CelulaRegistro } from "./celula-registro";

interface Props {
  data: Row[];
  headers: Field[];
  order: string[];
}

export function List({ data, headers, order }: Props): React.ReactElement {
  return (
    <BaseTabela>
      {headers?.length > 0 && (
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            {headers
              ?.sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id))
              ?.filter((f) => f?.configuration?.listing && !f?.trashed)
              ?.map((field) => (
                <ListHeadCell field={field} />
              ))}

            <TableHead className="w-[120px]"></TableHead>
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

              <TableCell className="w-[80px]">
                <ActionMenu row={row} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </BaseTabela>
  );
}
