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
export function FieldCollectionListing({ defaultValue = false }: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.listing"
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel>
              {t(
                "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_SHOW_LIST_LABEL",
                t("COLLECTION_FIELD_LISTING_LABEL", "Display in list")
              )}
            </FormLabel>
            <FormDescription>
              {t(
                "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_SHOW_LIST_DESCRIPTION",
                t("COLLECTION_FIELD_LISTING_DESCRIPTION", "Use this field to display in the list?")
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
                onCheckedChange={field.onChange}
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
