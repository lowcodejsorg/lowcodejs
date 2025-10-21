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

export function FieldCollectionTrashed({ defaultValue = false }: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="trashed"
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel>
              {t(
                "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_TRASH_LABEL",
                "Alocar para lixeira"
              )}
            </FormLabel>
            <FormDescription>
              {t(
                "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_TRASH_DESCRIPTION",
                "Enviar este campo para a lixeira?"
              )}
            </FormDescription>
          </div>
          <FormControl>
            <div className="inline-flex space-x-2">
              <span className="text-sm">
                {t("COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_NO_OPTION", "Não")}
              </span>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  form.setValue(
                    "trashedAt",
                    checked ? new Date().toISOString() : null
                  );
                  form.setValue(
                    "configuration.required",
                    checked ? false : true
                  );
                  field.onChange(checked);
                }}
                aria-readonly
              />
              <span className="text-sm">
                {t("COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_YES_OPTION", "Sim")}
              </span>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
