import type { Field, Row } from "@/lib/entity";
import React from "react";
import { ActionMenu } from "./action.menu";
import { GalleryRowCell } from "./gallery-row-cell";
interface Props {
  data: Row[];
  headers: Field[];
  order: string[];
}

export function Gallery({ data, headers, order }: Props): React.ReactElement {
  return (
    <main className="flex-1 w-full flex flex-col  rounded-md gap-4 p-4">
      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {data?.map((row) => {
          return (
            <div
              key={row._id}
              className="flex flex-col gap-3 px-4 pb-4 rounded-lg border w-full"
            >
              <div className="inline-flex items-center justify-end">
                <ActionMenu row={row} />
              </div>

              {headers
                ?.sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id))
                ?.filter((f) => f?.configuration?.listing && !f?.trashed)
                ?.map((field) => (
                  <GalleryRowCell
                    field={field}
                    row={row}
                    key={row?._id?.concat("-").concat(row?._id)}
                  />
                ))}
            </div>
          );
        })}
      </section>
    </main>
  );
}
