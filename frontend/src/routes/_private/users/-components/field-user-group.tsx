import { SimpleSelect } from "@/components/common/simple-select";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { UserGroup } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  useFormContext,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";

type FieldUserGroupProps = {
  field: ControllerRenderProps<FieldValues, "groups">;
};

export function FieldUserGroup({ field }: FieldUserGroupProps) {
  const { t } = useI18n();

  const response = useQuery({
    queryKey: ["/user-group"],

    queryFn: async function () {
      const route = "/user-group";
      const response = await API.get<UserGroup[]>(route);
      return response.data;
    },
  });

  const form = useFormContext();

  const hasError = Boolean(form.formState.errors[field.name]);

  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        {t("USER_ROUTE_SHEET_FIELD_ROLE_LABEL", "Cargo")}
        <span className="text-destructive">*</span>
      </FormLabel>
      <FormControl>
        <SimpleSelect
          placeholder={
            t(
              "USER_ROUTE_SHEET_FIELD_ROLE_PLACEHOLDER",
              "Selecione o cargo"
            ) as string
          }
          selectedValues={field.value}
          onChange={(values) => {
            field.onChange(values);
            const [option] = values;
            if (!option) return;
            form.setValue("group", option?.value);
          }}
          options={
            response?.data?.map((g) => ({ value: g._id, label: g.name })) ?? []
          }
          className={cn("w-full", hasError && "border-destructive")}
          disabled={response.status === "pending"}
        />
      </FormControl>

      <FormMessage className="text-right text-destructive" />
    </FormItem>
  );
}
