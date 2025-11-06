import { type Field, type Row, type Storage } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { FileIcon } from "lucide-react";

interface Props {
  row: Row;
  field: Field;
  isGallery?: boolean;
}
export function FieldFile({ field, row, isGallery = false }: Props) {
  const values = Array.from<Storage>(row?.[field?.slug] ?? []);

  return (
    <ul className={cn("space-y-1", isGallery && "grid grid-cols-4 gap-1")}>
      {values?.map((value) => {
        const isImage = value.type.includes("image");

        if (isGallery && isImage) {
          return (
            <li key={value?._id}>
              <Link
                to={value?.url}
                target="_blank"
                className="w-full text-center flex flex-col gap-1 items-center underline underline-offset-2"
              >
                <img
                  src={value?.url}
                  alt={value?.originalName}
                  className="size-16"
                />
                <span className="text-xs text-center">
                  {value?.originalName}
                </span>
              </Link>
            </li>
          );
        }

        if (isGallery && !isImage) {
          return (
            <li key={value?._id}>
              <Link
                to={value?.url}
                target="_blank"
                className="w-full text-center flex flex-col gap-1 items-center underline underline-offset-2"
              >
                <FileIcon
                  className="size-16 text-muted-foreground"
                  strokeWidth={1}
                />
                <span className="text-xs text-center">
                  {value?.originalName}
                </span>
              </Link>
            </li>
          );
        }

        return (
          <li key={value?._id}>
            <Link to={value?.url} target="_blank">
              {value?.originalName}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
