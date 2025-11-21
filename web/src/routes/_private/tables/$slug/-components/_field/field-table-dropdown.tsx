import {
  MultipleSelector,
  type Option,
} from "@/components/common/multi-selector";
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

export function FieldTableDropdown({
  defaultValue,
  required,
}: {
  defaultValue?: Option[];
  required?: boolean;
}) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.dropdown"
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value && required)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_OPTIONS_REQUIRED_ERROR",
              "Adicione ao menos uma opção"
            );

          if (value && Array.isArray(value) && value.length === 0 && required)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_OPTIONS_REQUIRED_ERROR",
              "Adicione ao menos uma opção"
            );

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.getFieldState(field.name).error;
        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              {t("TABLE_ROUTE_SHEET_INTERNAL_FIELD_OPTIONS_LABEL", "Opções")}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <MultipleSelector
                onChange={field.onChange}
                defaultOptions={defaultValue}
                value={field.value ?? []}
                creatable
                triggerSearchOnFocus
                allowReorder={true}
                placeholder={
                  t(
                    "TABLE_ROUTE_SHEET_INTERNAL_FIELD_OPTIONS_PLACEHOLDER",
                    "Escreva e adicione"
                  ) as string
                }
                emptyIndicator={null}
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
