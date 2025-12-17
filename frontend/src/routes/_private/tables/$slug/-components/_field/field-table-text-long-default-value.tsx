import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/i18.hook";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

export function FieldTableTextLongDefaultValue({
  className,
  required,
  defaultValue,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.defaultValue"
      defaultValue={defaultValue ?? ""}
      render={({ field }) => {
        const hasError = !!form.getFieldState(field.name).error;

        return (
          <FormItem className="space-y-1">
            <FormLabel className="data-[error=true]:text-destructive">
              {t(
                "TABLE_ROUTE_SHEET_INTERNAL_FIELD_DEFAULT_VALUE_LABEL",
                "Padrão"
              )}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={
                  t(
                    "TABLE_ROUTE_SHEET_INTERNAL_FIELD_DEFAULT_VALUE_PLACEHOLDER",
                    "Nome da coluna"
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
