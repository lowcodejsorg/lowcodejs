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
import type { Field } from "@/lib/entity";
import { cn } from "@/lib/utils";
import React from "react";
import { useFormContext } from "react-hook-form";

interface Props {
  required?: boolean;
  defaultValue?: SelectOption[];
  field: Field;
  isMultiple?: boolean;
  name?: string;
}

export function RowTableDropdown({
  field: fieldProp,
  isMultiple = false,
  required,
  defaultValue,
  name,
}: Props) {
  const { t } = useI18n();
  const form = useFormContext();
  const [selected, setSelected] = React.useState<SelectOption[]>([
    ...(defaultValue || []),
  ]);

  const OPTIONS =
    fieldProp?.configuration.dropdown?.map((option) => ({
      label: option,
      value: option,
    })) ?? [];

  return (
    <FormField
      control={form.control}
      name={name ?? fieldProp.slug}
      defaultValue={defaultValue?.flatMap((v) => v.value) ?? []}
      rules={{
        validate: (value) => {
          if (!value && required)
            return fieldProp.name
              .concat(" ")
              .concat(
                t(
                  "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_FIELD_REQUIRED_ERROR",
                  t("TABLE_FIELD_REQUIRED_SUFFIX", "is required")
                ) as string
              );

          if (required && Array.from(value).length === 0)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_AT_LEAST_ONE_OPTION_ERROR",
              t(
                "TABLE_DROPDOWN_VALIDATION_ADD_OPTION",
                "Add at least one option"
              )
            );
          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];

        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              {fieldProp.name}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <SimpleSelect
                placeholder={
                  t(
                    "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_SELECT_TYPE_PLACEHOLDER",
                    t("TABLE_SELECT_TYPE_PLACEHOLDER", "Select type")
                  ) as string
                }
                selectedValues={selected}
                onChange={(options) => {
                  setSelected(options);

                  if (isMultiple) {
                    const normalized = options.map((v) => v.value);
                    field.onChange(normalized);
                    return;
                  }

                  const [option] = options;
                  field.onChange(option.value);
                }}
                options={OPTIONS}
                className={cn("w-full", hasError && "border-destructive")}
                isMultiple={isMultiple}
              />
            </FormControl>

            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
