import type { Field, Row } from "@/lib/entity";

interface Props {
  row: Row;
  field: Field;
}
export function FieldTextShort({ field, row }: Props) {
  return (
    <p className="text-muted-foreground text-sm max-w-sm truncate">
      {row?.[field.slug!] ?? "-"}
    </p>
  );
}
