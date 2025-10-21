import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/i18.hook";
import type { Field } from "@/lib/entity";
import { cn } from "@/lib/utils";
import React from "react";
import { useFormContext } from "react-hook-form";

export function RowCollectionTextLong({
  field: fieldProp,
  required,
  className,
  defaultValue,
  name,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  field: Field;
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
                  t("COLLECTION_FIELD_REQUIRED_SUFFIX", "is required")
                ) as string
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
              <Textarea
                placeholder={fieldProp.name}
                className={cn("", hasError && "border-destructive", className)}
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
