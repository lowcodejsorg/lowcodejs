import { Badge } from "@/components/ui/badge";
import type { Field, Row } from "@/lib/entity";
import { getCategoryItem } from "@/lib/utils";

interface Props {
  row: Row;
  field: Field;
}
export function FieldCategory({ field, row }: Props) {
  const values = Array.from<string>(row?.[field.slug!] ?? []);
  const items = values.map((value) =>
    getCategoryItem(field.configuration.category ?? [], value)
  );
  return (
    <div className="inline-flex flex-wrap gap-1">
      {items?.length === 0 && "-"}
      {items?.map((value) => {
        return (
          <Badge
            key={value?.id}
            variant="outline"
            className="text-muted-foreground"
          >
            {value?.label}
          </Badge>
        );
      })}
    </div>
  );
}
