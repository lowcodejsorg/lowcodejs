import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/i18.hook";
import type { Field } from "@/lib/entity";
import { cn } from "@/lib/utils";
import React from "react";
import { useFormContext } from "react-hook-form";

export function RowCollectionTextShort({
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
      name={(name ?? fieldProp.slug) || ""}
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value && required)
            return fieldProp.name
              .concat(" ")
              .concat(
                t(
                  "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_FIELD_REQUIRED_ERROR",
                  "é obrigatório"
                ) as string
              );

          return true;
        },
      }}
      render={({ field: { onChange, ...field } }) => {
        const hasError = !!form.formState.errors[field.name];
        return (
          <FormItem className="space-y-1">
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
