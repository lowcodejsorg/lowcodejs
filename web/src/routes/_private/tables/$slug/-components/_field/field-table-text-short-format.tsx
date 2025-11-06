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
import { FIELD_FORMAT } from "@/lib/entity";

import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

interface Props {
  required?: boolean;
  defaultValue?: SelectOption[];
}
export function FieldTableTextShortFormat({ defaultValue, required }: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  const COLUMN_TEXT_SHORT_FORMAT_LIST = [
    {
      label: t("FIELD_FORMAT_ALPHANUMERIC_LABEL", "Alfanumérico") as string,
      value: FIELD_FORMAT.ALPHA_NUMERIC,
    },
    {
      label: t("FIELD_FORMAT_INTEGER_LABEL", "Inteiro") as string,
      value: FIELD_FORMAT.INTEGER,
    },
    {
      label: t("FIELD_FORMAT_DECIMAL_LABEL", "Decimal") as string,
      value: FIELD_FORMAT.DECIMAL,
    },
    {
      label: t("FIELD_FORMAT_URL_LABEL", "URL") as string,
      value: FIELD_FORMAT.URL,
    },
    {
      label: t("FIELD_FORMAT_EMAIL_LABEL", "E-mail") as string,
      value: FIELD_FORMAT.EMAIL,
    },
  ];

  return (
    <FormField
      control={form.control}
      name="configuration.format"
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value && required)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_FORMAT_REQUIRED_ERROR",
              "Formato é obrigatório"
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
        const hasError = !!form.formState.errors[field.name];

        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              {t("TABLE_ROUTE_SHEET_INTERNAL_FIELD_FORMAT_LABEL", "Formato")}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <SimpleSelect
                placeholder={
                  t(
                    "TABLE_ROUTE_SHEET_INTERNAL_FIELD_FORMAT_PLACEHOLDER",
                    t("TABLE_SELECT_FORMAT_PLACEHOLDER", "Select the format")
                  ) as string
                }
                selectedValues={field.value ?? []}
                onChange={field.onChange}
                options={COLUMN_TEXT_SHORT_FORMAT_LIST}
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
