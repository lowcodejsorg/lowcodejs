import {
  SimpleSelect,
  type SelectOption,
} from "@/components/common/simple-select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Table } from "@/lib/entity";
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

  const slug = form.watch("configuration.relationship.table.slug");

  const table = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const OPTIONS = table?.data?.fields?.map((field) => ({
    label: field.name,
    value: field._id,
    slug: field.slug,
  }));

  const hasError = Boolean(form.getFieldState(field.name).error);

  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        {t(
          "TABLE_ROUTE_SHEET_INTERNAL_FIELD_RELATIONSHIP_FIELD_LABEL",
          "Campo da lista"
        )}{" "}
        {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <FormControl>
        <SimpleSelect
          disabled={table.status === "pending"}
          placeholder={
            t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_RELATIONSHIP_FIELD_PLACEHOLDER",
              t(
                "TABLE_SELECT_COLUMN_PLACEHOLDER",
                "Select the displayed column"
              )
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

export function FieldTableRelationshipView({ defaultValue, required }: Props) {
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
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_RELATIONSHIP_FIELD_REQUIRED_ERROR",
              "Coluna exibida é obrigatória"
            );

          if (value && Array.isArray(value) && value.length === 0 && required)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_OPTIONS_REQUIRED_ERROR",
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
