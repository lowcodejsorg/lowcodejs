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
import { useFormContext } from "react-hook-form";

export function FieldCollectionTextShortDefaultValue({
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
      name="configuration.defaultValue"
      defaultValue={defaultValue ?? ""}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];

        return (
          <FormItem className="space-y-1">
            <FormLabel className="data-[error=true]:text-destructive">
              {t(
                "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_DEFAULT_VALUE_LABEL",
                "Valor padrão"
              )}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={
                  t(
                    "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_DEFAULT_VALUE_PLACEHOLDER",
                    "Valor padrão"
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
