import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/i18.hook";
import { FIELD_FORMAT, type Field } from "@/lib/entity";
import { cn } from "@/lib/utils";
import React from "react";
import { useFormContext } from "react-hook-form";

const validateFormat = (
  value: string,
  format: FIELD_FORMAT | null
): string | true => {
  if (!value || !format) return true;

  switch (format) {
    case FIELD_FORMAT.ALPHA_NUMERIC:
      if (!/^[a-zA-Z0-9\s]*$/.test(value)) {
        return "Campo deve conter apenas letras, números e espaços";
      }
      break;
    case FIELD_FORMAT.INTEGER:
      if (!/^-?\d+$/.test(value)) {
        return "Campo deve conter apenas números inteiros";
      }
      break;
    case FIELD_FORMAT.DECIMAL:
      if (!/^-?\d*\.?\d+$/.test(value)) {
        return "Campo deve conter apenas números decimais";
      }
      break;
    case FIELD_FORMAT.URL:
      try {
        new URL(value);
      } catch {
        return "Campo deve conter uma URL válida";
      }
      break;
    case FIELD_FORMAT.EMAIL:
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Campo deve conter um email válido";
      }
      break;
  }
  return true;
};

export function RowTableTextShort({
  field: fieldProp,
  className,
  required,
  name,
  defaultValue,
  ...props
}: React.ComponentProps<typeof Input> & {
  field: Field;
  isDataTableChild?: boolean;
}) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      key={fieldProp._id}
      control={form.control}
      name={(fieldProp.slug ?? name) || ""}
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value && required)
            return fieldProp.name
              .concat(" ")
              .concat(
                t(
                  "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_FIELD_REQUIRED_ERROR",
                  "é obrigatório"
                ) as string
              );

          const formatValidation = validateFormat(
            value,
            fieldProp.configuration.format
          );
          if (formatValidation !== true) {
            return formatValidation;
          }

          return true;
        },
      }}
      render={({ field: { onChange, ...field } }) => {
        const hasError = !!form.formState.errors[field.name];
        return (
          <FormItem className="space-y-1 w-full">
            <FormLabel className="data-[error=true]:text-destructive">
              {fieldProp.name}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={fieldProp.name}
                className={cn(hasError && "border-destructive", className)}
                onChange={(event) => {
                  onChange(event.target.value);
                }}
                {...field}
                {...props}
              />
            </FormControl>
            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
