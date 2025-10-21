import { API } from "@/lib/api";
import {
  FIELD_TYPE,
  type Collection,
  type Field,
  type Row,
} from "@/lib/entity";
import { cn } from "@/lib/utils";
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

interface Props {
  field: Field;
  row: Row;
  isSheet?: boolean;
}

export function GalleryRowCell({ row, field, isSheet = false }: Props) {
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

  if (!(field?.slug in row) || !row) {
    return (
      <div key={field?._id?.toString()} className="space-x-1">
        <h2 className="font-semibold">{field?.name}</h2>
        <p className="text-muted-foreground text-sm">-</p>
      </div>
    );
  }

  if (field?.type === FIELD_TYPE.TEXT_SHORT) {
    return (
      <div className="flex flex-col" key={field._id?.toString()}>
        <h2 className="font-semibold text-sm">{field?.name}</h2>
        <FieldTextShort field={field} row={row} />
      </div>
    );
  }

  if (field.type === FIELD_TYPE.TEXT_LONG) {
    return (
      <div className="flex flex-col" key={field._id?.toString()}>
        <h2 className="font-semibold text-sm">{field?.name}</h2>
        <FieldTextLong
          field={field}
          row={row}
          className={cn(!isSheet && "max-w-sm truncate")}
        />
      </div>
    );
  }

  if (field?.type === FIELD_TYPE.FILE) {
    return (
      <div className="flex flex-col gap-4" key={field?._id?.toString()}>
        <h2 className="font-semibold text-sm">{field?.name}</h2>
        <FieldFile field={field} row={row} isGallery />
      </div>
    );
  }

  if (field?.type === FIELD_TYPE.DROPDOWN) {
    return (
      <div className="flex flex-col gap-0.5" key={field._id?.toString()}>
        <h2 className="font-semibold text-sm">{field?.name}</h2>
        <FieldDropdown field={field} row={row} />
      </div>
    );
  }

  if (field?.type === FIELD_TYPE.CATEGORY) {
    return (
      <div className="flex flex-col gap-0.5" key={field._id?.toString()}>
        <h2 className="font-semibold text-sm">{field?.name}</h2>
        <FieldCategory field={field} row={row} />
      </div>
    );
  }

  if (field?.type === FIELD_TYPE.DATE) {
    return (
      <div className="flex flex-col gap-0.5" key={field._id?.toString()}>
        <h2 className="font-semibold text-sm">{field?.name}</h2>
        <FieldDate field={field} row={row} />
      </div>
    );
  }

  if (field?.type === FIELD_TYPE.RELATIONSHIP) {
    return (
      <div className="flex flex-col gap-0.5" key={field._id?.toString()}>
        <h2 className="font-semibold text-sm">{field?.name}</h2>
        <FieldRelationship field={field} row={row} />
      </div>
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
        <h2 className="font-semibold text-sm">{field?.name}</h2>
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

  if (field?.type === FIELD_TYPE.REACTION) {
    return (
      <div className="flex flex-col gap-0.5" key={field?._id?.toString()}>
        <h2 className="font-semibold text-sm">{field?.name}</h2>
        <FieldReaction field={field} row={row} />
      </div>
    );
  }

  if (field?.type === FIELD_TYPE.EVALUATION) {
    return (
      <div className="flex flex-col gap-0.5" key={field?._id?.toString()}>
        <h2 className="font-semibold text-sm">{field?.name}</h2>
        <FieldEvaluation size={16} field={field} row={row} />
      </div>
    );
  }
}
