import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/i18.hook";
import { cn } from "@/lib/utils";
import React from "react";
import { useFormContext } from "react-hook-form";

export function FieldTableName({
  className,
  required,
  defaultValue,
  ...props
}: React.ComponentProps<typeof Input>) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="name"
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_NAME_REQUIRED_ERROR",
              "Nome é obrigatório"
            );

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];
        return (
          <FormItem className="space-y-1">
            <FormLabel className="data-[error=true]:text-destructive ">
              {t("TABLE_ROUTE_SHEET_INTERNAL_FIELD_NAME_LABEL", "Nome")}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={
                  t(
                    "TABLE_ROUTE_SHEET_INTERNAL_FIELD_NAME_PLACEHOLDER",
                    "Nome do campo"
                  ) as string
                }
                className={cn(hasError && "border-destructive", className)}
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
