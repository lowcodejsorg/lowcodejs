import type { Field, Row } from "@/lib/entity";
import { cn } from "@/lib/utils";

interface Props {
  row: Row;
  field: Field;
  className?: string;
}
export function FieldTextLong({ field, row, className }: Props) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)}>
      {row?.[field.slug!] ?? "-"}
    </p>
  );
}
