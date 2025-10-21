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
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

interface Props {
  required?: boolean;
  defaultValue?: SelectOption[];
}

export function FieldCollectionRelationshipOrder({
  defaultValue,
  required,
}: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  const ORDER_LIST = [
    {
      label: t("FIELD_ORDER_ASCENDING_LABEL", "Ascendente") as string,
      value: "asc",
    },
    {
      label: t("FIELD_ORDER_DESCENDING_LABEL", "Descendente") as string,
      value: "desc",
    },
  ];

  return (
    <FormField
      control={form.control}
      name="configuration.relationship.order"
      defaultValue={defaultValue ?? []}
      rules={{
        validate: (value) => {
          if (!value && required)
            return t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_ORDER_REQUIRED_ERROR",
              "Ordem é obrigatório"
            );

          if (value && Array.isArray(value) && value.length === 0 && required)
            return t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_OPTIONS_REQUIRED_ERROR",
              "Adicione ao menos uma opção"
            );

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = Boolean(form.formState.errors[field.name]);

        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              {t("COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_ORDER_LABEL", "Ordem")}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <SimpleSelect
                placeholder={
                  t(
                    "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_ORDER_PLACEHOLDER",
                    t("COLLECTION_SELECT_ORDER_PLACEHOLDER", "Select the order")
                  ) as string
                }
                selectedValues={field.value ?? []}
                onChange={field.onChange}
                options={ORDER_LIST}
                className={cn("w-full", hasError && "border-destructive")}
              />
            </FormControl>

            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
