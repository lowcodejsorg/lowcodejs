import { TableCell } from "@/components/ui/table";
import { API } from "@/lib/api";

import {
  FIELD_TYPE,
  type Collection,
  type Field,
  type Row,
} from "@/lib/entity";

import { useQuery } from "@tanstack/react-query";
import { FieldCategory } from "./_field/field-category";
import { FieldDate } from "./_field/field-date";
import { FieldDropdown } from "./_field/field-dropdown";
import { FieldEvaluation } from "./_field/field-evaluation";
import { FieldFile } from "./_field/field-file";
import { FieldReaction } from "./_field/field-reaction";
import { FieldRelationship } from "./_field/field-relationship";
import { FieldTextLong } from "./_field/field-text-long";
import { FieldTextShort } from "./_field/field-text-short";
import { GalleryRowCell } from "./gallery-row-cell";

interface Props {
  field: Field;
  row: Row;
}

export function ListRowCell({ field, row }: Props) {
  const collection = useQuery({
    queryKey: ["/collections/".concat(field.slug), field.slug],
    queryFn: async () => {
      const route = "/collections/".concat(field.slug);
      const response = await API.get<Collection>(route);
      return response.data;
    },
    enabled:
      Boolean(field.slug) && Boolean(field.type === FIELD_TYPE.FIELD_GROUP),
  });

  const KEY = field._id?.concat("-").concat(row._id);

  if (!(field.slug in row) || !row) return <TableCell key={KEY}>-</TableCell>;

  if (field.type === FIELD_TYPE.TEXT_SHORT) {
    return (
      <TableCell key={KEY}>
        <FieldTextShort field={field} row={row} />
      </TableCell>
    );
  }

  if (field.type === FIELD_TYPE.TEXT_LONG) {
    return (
      <TableCell key={KEY}>
        <FieldTextLong field={field} row={row} className="max-w-sm truncate" />
      </TableCell>
    );
  }

  if (field.type === FIELD_TYPE.FILE) {
    return (
      <TableCell key={KEY}>
        <FieldFile field={field} row={row} />
      </TableCell>
    );
  }

  if (field.type === FIELD_TYPE.DROPDOWN) {
    return (
      <TableCell key={KEY}>
        <FieldDropdown field={field} row={row} />
      </TableCell>
    );
  }

  if (field.type === FIELD_TYPE.CATEGORY) {
    return (
      <TableCell key={KEY}>
        <FieldCategory field={field} row={row} />
      </TableCell>
    );
  }

  if (field.type === FIELD_TYPE.DATE) {
    return (
      <TableCell key={KEY}>
        <FieldDate field={field} row={row} />
      </TableCell>
    );
  }

  if (field.type === FIELD_TYPE.RELATIONSHIP) {
    return (
      <TableCell key={KEY}>
        <FieldRelationship field={field} row={row} />
      </TableCell>
    );
  }

  if (
    field?.type === FIELD_TYPE.FIELD_GROUP &&
    collection.status === "success"
  ) {
    const total = row?.[field.slug!]?.length || 0;
    const rows = Array.from({ length: total });

    return (
      <div className="flex flex-col gap-2" key={field._id?.toString()}>
        {rows?.map((_, index) => (
          <div
            key={row?.[field.slug!][index]?._id}
            className="grid grid-cols-2 gap-2"
          >
            {collection?.data?.fields
              ?.filter((c) => c.type !== FIELD_TYPE.FIELD_GROUP)
              ?.map((c) => (
                <GalleryRowCell
                  key={c._id?.toString()}
                  field={c}
                  row={row?.[field.slug!][index]}
                />
              ))}
          </div>
        ))}
      </div>
    );
  }

  if (field.type === FIELD_TYPE.REACTION) {
    return (
      <TableCell key={KEY}>
        <FieldReaction field={field} row={row} />
      </TableCell>
    );
  }

  if (field.type === FIELD_TYPE.EVALUATION) {
    return (
      <TableCell key={KEY}>
        <FieldEvaluation size={16} field={field} row={row} />
      </TableCell>
    );
  }
}
