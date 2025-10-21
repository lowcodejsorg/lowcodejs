import { Badge } from "@/components/ui/badge";
import type { Field, Row } from "@/lib/entity";

interface Props {
  row: Row;
  field: Field;
}
export function FieldRelationship({ field, row }: Props) {
  const values = Array.from<string>(row?.[field.slug!] ?? [])?.map<string>(
    (r) =>
      (r as unknown as { [key: string]: string })[
        field!.configuration!.relationship!.field!.slug!
      ]
  );

  return (
    <div className="inline-flex flex-wrap gap-1">
      {values?.length === 0 && "-"}
      {values?.map((value) => {
        return (
          <Badge
            key={value}
            variant="outline"
            className="text-muted-foreground"
          >
            {value}
          </Badge>
        );
      })}
    </div>
  );
}
