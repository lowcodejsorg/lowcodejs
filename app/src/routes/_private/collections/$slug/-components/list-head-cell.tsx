import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import type { Field } from "@/lib/entity";
import React from "react";
import { FieldCollectionUpdateSheet } from "./field-collection-update-sheet";

interface Props {
  field: Field;
}

export function ListHeadCell({ field }: Props) {
  const updateCollectionFieldButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  return (
    <TableHead key={field._id} className="w-auto">
      <div className="inline-flex items-center">
        <Button
          className="cursor-pointer h-auto px-2 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent"
          variant="link"
          onClick={() => {
            updateCollectionFieldButtonRef?.current?.click();
          }}
        >
          {field.name}
        </Button>

        {/* <DropdownInterna.AcoesCabecalho campo={campo} /> */}
      </div>
      <FieldCollectionUpdateSheet
        _id={field._id}
        ref={updateCollectionFieldButtonRef}
      />
    </TableHead>
  );
}
