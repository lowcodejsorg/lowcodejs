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
  defaultValue?: SelectOption[];
  required?: boolean;
}

const COLUMN_DATE_FORMAT_LIST = [
  {
    label: "DD/MM/AAAA",
    value: FIELD_FORMAT["DD_MM_YYYY"],
  },
  {
    label: "MM/DD/AAAA",
    value: FIELD_FORMAT["MM_DD_YYYY"],
  },
  {
    label: "AAAA/MM/DD",
    value: FIELD_FORMAT["YYYY_MM_DD"],
  },
  {
    label: "DD/MM/AAAA hh:mm:ss",
    value: FIELD_FORMAT["DD_MM_YYYY_HH_MM_SS"],
  },
  {
    label: "MM/DD/AAAA hh:mm:ss",
    value: FIELD_FORMAT["MM_DD_YYYY_HH_MM_SS"],
  },
  {
    label: "AAAA/MM/DD hh:mm:ss",
    value: FIELD_FORMAT["YYYY_MM_DD_HH_MM_SS"],
  },
  {
    label: "DD-MM-AAAA",
    value: FIELD_FORMAT["DD_MM_YYYY_DASH"],
  },
  {
    label: "MM-DD-AAAA",
    value: FIELD_FORMAT["MM_DD_YYYY_DASH"],
  },
  {
    label: "AAAA-MM-DD",
    value: FIELD_FORMAT["YYYY_MM_DD_DASH"],
  },
  {
    label: "DD-MM-AAAA hh:mm:ss",
    value: FIELD_FORMAT["DD_MM_YYYY_HH_MM_SS_DASH"],
  },
  {
    label: "MM-DD-AAAA hh:mm:ss",
    value: FIELD_FORMAT["MM_DD_YYYY_HH_MM_SS_DASH"],
  },
  {
    label: "AAAA-MM-DD hh:mm:ss",
    value: FIELD_FORMAT["YYYY_MM_DD_HH_MM_SS_DASH"],
  },
];

export function FieldTableDateFormat({ defaultValue = [], required }: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.format"
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_FORMAT_REQUIRED_ERROR",
              "Formato é obrigatório"
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
                options={COLUMN_DATE_FORMAT_LIST ?? []}
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
