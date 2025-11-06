import type { Field, Row } from "@/lib/entity";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  row: Row;
  field: Field;
}
export function FieldDate({ field, row }: Props) {
  return (
    <p className="text-muted-foreground text-sm">
      {(row?.[field.slug!] &&
        format(row?.[field.slug!], field.configuration.format!, {
          locale: ptBR,
        })) ??
        "-"}
    </p>
  );
}
