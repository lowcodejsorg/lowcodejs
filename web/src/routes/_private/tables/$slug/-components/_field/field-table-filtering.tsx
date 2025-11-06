import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/hooks/i18.hook";
import { useFormContext } from "react-hook-form";

interface Props {
  defaultValue?: boolean;
}

export function FieldTableFiltering({ defaultValue = false }: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.filtering"
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel>
              {t(
                "TABLE_ROUTE_SHEET_INTERNAL_FIELD_SHOW_FILTER_LABEL",
                "Usar no filtro"
              )}
            </FormLabel>
            <FormDescription>
              {t(
                "TABLE_ROUTE_SHEET_INTERNAL_FIELD_SHOW_FILTER_DESCRIPTION",
                "Usar este campo para filtrar os dados?"
              )}
            </FormDescription>
          </div>
          <FormControl>
            <div className="inline-flex space-x-2">
              <span className="text-sm">
                {t("TABLE_ROUTE_SHEET_INTERNAL_FIELD_NO_OPTION", "Não")}
              </span>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-readonly
              />
              <span className="text-sm">
                {t("TABLE_ROUTE_SHEET_INTERNAL_FIELD_YES_OPTION", "Sim")}
              </span>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
