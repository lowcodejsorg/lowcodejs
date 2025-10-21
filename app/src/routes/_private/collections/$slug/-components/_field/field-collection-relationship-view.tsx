import {
  SimpleSelect,
  type SelectOption,
} from "@/components/custom/simple-select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Collection } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  useFormContext,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";

type Option = SelectOption & { slug: string };

interface Props {
  required?: boolean;
  defaultValue?: Option[];
}

function RelationshipField({
  field,
  required,
}: {
  field: ControllerRenderProps<
    FieldValues,
    "configuration.relationship.field._id"
  >;
  required?: boolean;
}) {
  const { t } = useI18n();
  const form = useFormContext();

  const slug = form.watch("configuration.relationship.collection.slug");

  const collection = useQuery({
    queryKey: ["/collections/".concat(slug), slug],
    queryFn: async () => {
      const route = "/collections/".concat(slug);
      const response = await API.get<Collection>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const OPTIONS = collection?.data?.fields?.map((field) => ({
    label: field.name,
    value: field._id,
    slug: field.slug,
  }));

  const hasError = Boolean(form.getFieldState(field.name).error);

  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        {t(
          "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_RELATIONSHIP_FIELD_LABEL",
          "Campo da lista"
        )}{" "}
        {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <FormControl>
        <SimpleSelect
          disabled={collection.status === "pending"}
          placeholder={
            t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_RELATIONSHIP_FIELD_PLACEHOLDER",
              t("COLLECTION_SELECT_COLUMN_PLACEHOLDER", "Select the displayed column")
            ) as string
          }
          selectedValues={field.value ?? []}
          onChange={(options) => {
            field.onChange(options);

            const [option] = options as Option[];

            if (!option.value) return;

            form.setValue("configuration.relationship.field.slug", option.slug);
          }}
          options={OPTIONS ?? []}
          className={cn("w-full", hasError && "border-destructive")}
        />
      </FormControl>

      <FormMessage className="text-right text-destructive" />
    </FormItem>
  );
}

export function FieldCollectionRelationshipView({
  defaultValue,
  required,
}: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      defaultValue={defaultValue ?? []}
      name="configuration.relationship.field._id"
      rules={{
        validate: (value) => {
          if (!value && required)
            return t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_RELATIONSHIP_FIELD_REQUIRED_ERROR",
              "Coluna exibida é obrigatória"
            );

          if (value && Array.isArray(value) && value.length === 0 && required)
            return t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_OPTIONS_REQUIRED_ERROR",
              "Adicione ao menos uma opção"
            );

          return true;
        },
      }}
      render={({ field }) => (
        <RelationshipField field={field} required={required} />
      )}
    />
  );
}
