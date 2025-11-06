import {
  SimpleSelect,
  type SelectOption,
} from "@/components/custom/simple-select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import { useTableManagement } from "@/hooks/table-management.hook";
import { API } from "@/lib/api";
import { FIELD_TYPE, type Table } from "@/lib/entity";

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";

type Option = SelectOption & {
  slug?: string;
};

interface Props {
  required?: boolean;
  defaultValue?: Option[];
  disabled?: boolean;
}

export function FieldTableType({
  defaultValue = [],
  required,
  disabled = false,
}: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  const management = useTableManagement();

  const table = useQuery({
    queryKey: ["/tables/".concat(management.slug), management.slug],
    queryFn: async () => {
      const route = "/tables/".concat(management.slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(management.slug),
  });

  const COLUMN_TYPE_LIST: { value: FIELD_TYPE; label: string }[] = [
    {
      label: t("FIELD_TYPE_TEXT_SHORT_LABEL", "Texto") as string,
      value: FIELD_TYPE.TEXT_SHORT,
    },
    {
      label: t("FIELD_TYPE_TEXT_LONG_LABEL", "Texto longo") as string,
      value: FIELD_TYPE.TEXT_LONG,
    },
    {
      label: t("FIELD_TYPE_DROPDOWN_LABEL", "Dropdown") as string,
      value: FIELD_TYPE.DROPDOWN,
    },
    {
      label: t("FIELD_TYPE_FILE_LABEL", "Arquivo") as string,
      value: FIELD_TYPE.FILE,
    },
    {
      label: t("FIELD_TYPE_DATE_LABEL", "Data") as string,
      value: FIELD_TYPE.DATE,
    },
    {
      label: t("FIELD_TYPE_RELATIONSHIP_LABEL", "relationship") as string,
      value: FIELD_TYPE.RELATIONSHIP,
    },
    {
      label: t("TABLE_FIELD_GROUP_LABEL", "Field group") as string,
      value: FIELD_TYPE.FIELD_GROUP,
    },
    {
      label: t("FIELD_TYPE_TREE_LABEL", "Árvore") as string,
      value: FIELD_TYPE.CATEGORY,
    },
    {
      label: t("FIELD_TYPE_LIKE_LABEL", "Curtida") as string,
      value: FIELD_TYPE.REACTION,
    },
    {
      label: t("FIELD_TYPE_RATING_LABEL", "Avaliação") as string,
      value: FIELD_TYPE.EVALUATION,
    },
  ];

  return (
    <FormField
      control={form.control}
      name="type"
      defaultValue={defaultValue ?? []}
      rules={{
        validate: (value) => {
          if (!value && required)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_TYPE_REQUIRED_ERROR",
              "Tipo é obrigatório"
            );

          if (value && Array.isArray(value) && value.length === 0 && required)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_OPTIONS_REQUIRED_ERROR",
              "Adicione ao menos uma opção"
            );

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];

        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              {t("TABLE_ROUTE_SHEET_INTERNAL_FIELD_TYPE_LABEL", "Tipo")}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <SimpleSelect
                disabled={disabled}
                placeholder={
                  t(
                    "TABLE_ROUTE_SHEET_INTERNAL_FIELD_TYPE_PLACEHOLDER",
                    t("TABLE_SELECT_TYPE_PLACEHOLDER", "Select type")
                  ) as string
                }
                selectedValues={field.value ?? []}
                onChange={(options) => {
                  field.onChange(options);

                  const [option] = options;

                  if (!option) {
                    return;
                  }

                  form.reset({
                    type: options,
                    name: form.getValues().name,
                    configuration: {
                      listing: form.getValues().configuration.listing ?? false,
                      filtering:
                        form.getValues().configuration.filtering ?? false,
                      required:
                        form.getValues().configuration.required ?? false,

                      format: null,
                      defaultValue: null,
                      relationship: null,
                      dropdown: null,
                      category: null,
                      multiple: false,

                      ...([FIELD_TYPE.REACTION].includes(
                        option.value as FIELD_TYPE
                      ) && {
                        filtering: false,
                        required: false,
                      }),

                      ...([FIELD_TYPE.EVALUATION].includes(
                        option.value as FIELD_TYPE
                      ) && {
                        required: false,
                      }),

                      ...([
                        FIELD_TYPE.TEXT_SHORT,
                        FIELD_TYPE.TEXT_LONG,
                      ].includes(option.value as FIELD_TYPE) && {
                        format: form.getValues().configuration.format ?? null,
                        defaultValue:
                          form.getValues().configuration.defaultValue ?? null,
                      }),

                      ...([FIELD_TYPE.DATE].includes(
                        option.value as FIELD_TYPE
                      ) && {
                        format: form.getValues().configuration.format ?? null,
                      }),

                      ...([FIELD_TYPE.RELATIONSHIP].includes(
                        option.value as FIELD_TYPE
                      ) && {
                        relationship:
                          form.getValues().configuration.relationship ?? null,
                        multiple:
                          form.getValues().configuration.multiple ?? false,
                      }),

                      ...([FIELD_TYPE.DROPDOWN].includes(
                        option.value as FIELD_TYPE
                      ) && {
                        dropdown:
                          form.getValues().configuration.dropdown ?? null,
                        multiple:
                          form.getValues().configuration.multiple ?? false,
                      }),

                      ...([FIELD_TYPE.CATEGORY].includes(
                        option.value as FIELD_TYPE
                      ) && {
                        category:
                          form.getValues().configuration.category ?? null,
                        multiple:
                          form.getValues().configuration.multiple ?? false,
                      }),

                      ...([FIELD_TYPE.FILE].includes(
                        option.value as FIELD_TYPE
                      ) && {
                        multiple:
                          form.getValues().configuration.multiple ?? false,
                      }),

                      ...([FIELD_TYPE.FIELD_GROUP].includes(
                        option.value as FIELD_TYPE
                      ) && {
                        multiple:
                          form.getValues().configuration.multiple ?? false,
                      }),
                    },
                  });
                }}
                options={COLUMN_TYPE_LIST?.map((item) => {
                  if (
                    table?.data?.type === "field-group" &&
                    (item.value === FIELD_TYPE.FIELD_GROUP ||
                      item.value === FIELD_TYPE.EVALUATION ||
                      item.value === FIELD_TYPE.REACTION)
                  )
                    return {
                      label: item.label,
                      value: item.value,
                      disabled: true,
                    };

                  return {
                    label: item.label,
                    value: item.value,
                  };
                })}
                className={cn("w-full", hasError && "border-destructive")}
              />
            </FormControl>

            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
