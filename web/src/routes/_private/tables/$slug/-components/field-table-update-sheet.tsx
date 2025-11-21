import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import {
  FIELD_FORMAT,
  FIELD_TYPE,
  type Field,
  type Paginated,
  type Table,
} from "@/lib/entity";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import React from "react";

import { Button } from "@/components/ui/button";
import { Form as Root } from "@/components/ui/form";

import type { Option } from "@/components/common/multi-selector";
import { useTableManagement } from "@/hooks/table-management.hook";
import { QueryClient } from "@/lib/query-client";
import { AxiosError } from "axios";
import { LoaderCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldTableCategory } from "./_field/field-table-category";
import { FieldTableDateFormat } from "./_field/field-table-date-format";
import { FieldTableDropdown } from "./_field/field-table-dropdown";
import { FieldTableFiltering } from "./_field/field-table-filtering";
import { FieldTableListing } from "./_field/field-table-listing";
import { FieldTableMultiple } from "./_field/field-table-multiple";
import { FieldTableName } from "./_field/field-table-name";
import { FieldTableRelationship } from "./_field/field-table-relationship";
import { FieldTableRelationshipOrder } from "./_field/field-table-relationship-order";
import { FieldTableRelationshipView } from "./_field/field-table-relationship-view";
import { FieldTableRequired } from "./_field/field-table-required";
import { FieldTableTextLongDefaultValue } from "./_field/field-table-text-long-default-value";
import { FieldTableTextShortDefaultValue } from "./_field/field-table-text-short-default-value";
import { FieldTableTextShortFormat } from "./_field/field-table-text-short-format";
import { FieldTableTrashed } from "./_field/field-table-trashed";
import { FieldTableType } from "./_field/field-table-type";

export function FieldTableUpdateForm({
  field,
  onClose,
}: {
  field: Field;
  onClose: () => void;
}) {
  const { t } = useI18n();

  const management = useTableManagement();

  const search = useSearch({
    strict: false,
  });

  const form = useForm();

  const update = useMutation({
    mutationFn: async function (payload: Partial<Field>) {
      const route = "/tables/"
        .concat(management.slug)
        .concat("/fields/")
        .concat(field._id);
      const response = await API.put<Field>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      QueryClient.setQueryData<Field>(
        [
          "/tables/"
            .concat(management.slug)
            .concat("/fields/")
            .concat(data._id),
          data._id,
        ],
        data
      );

      QueryClient.setQueryData<Table>(
        ["/tables/".concat(management.slug), management.slug],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: old.fields.map((f) => {
              if (f._id === data._id) {
                return data;
              }
              return f;
            }),
          };
        }
      );

      QueryClient.setQueryData<Paginated<Table[]>>(
        ["/tables/paginated", search],
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((table) => {
              if (table.slug === management.slug) {
                return {
                  ...table,
                  fields: table.fields.map((f) => {
                    if (f._id === data._id) {
                      return data;
                    }
                    return f;
                  }),
                };
              }
              return table;
            }),
          };
        }
      );

      toast.success("Campo atualizado com sucesso");

      if (data.trashed) {
        toast.success(
          t(
            "TABLE_FIELD_SENT_TO_TRASH_MESSAGE",
            "Field sent to trash, to restore it, go to field management"
          )
        );
      }

      if (!data.trashed) {
        toast.success(
          t(
            "TABLE_FIELD_RESTORED_MESSAGE",
            "Field restored, to send to trash, go to field management"
          )
        );
      }

      onClose();
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ?? t("TABLE_ERROR_INVALID_DATA", "Invalid data")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t(
                "TABLE_ERROR_AUTHENTICATION_REQUIRED",
                "Authentication required"
              )
          );
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ??
              t(
                "TABLE_FIELD_ERROR_INSUFFICIENT_PERMISSIONS",
                "Insufficient permissions to update this field"
              )
          );
        }

        // 404 - FIELD_NOT_FOUND
        if (data?.code === 404 && data?.cause === "FIELD_NOT_FOUND") {
          toast.error(
            data?.message ?? t("TABLE_FIELD_ERROR_NOT_FOUND", "Field not found")
          );
        }

        if (data?.code == 409 && data?.cause == "LAST_ACTIVE_FIELD") {
          toast.error(
            "Último campo ativo, não deve ser enviado para a lixeira"
          );
          // toast.error(data?.message ?? "You cannot delete the last field");
        }

        // 409 - FIELD_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "FIELD_ALREADY_EXISTS") {
          form.setError("name", {
            message:
              data?.message ??
              t(
                "TABLE_FIELD_ERROR_NAME_ALREADY_EXISTS",
                "Field with this name already exists"
              ),
          });
        }

        // 409 - FIELD_IN_USE
        if (data?.code === 409 && data?.cause === "FIELD_IN_USE") {
          toast.error(
            data?.message ??
              t(
                "TABLE_FIELD_ERROR_CANNOT_CHANGE_TYPE",
                "Cannot change field type: field contains data"
              )
          );
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(
            data?.message ??
              t(
                "TABLE_FIELD_ERROR_INVALID_CONFIGURATION",
                "Invalid field configuration"
              )
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500 && data?.cause === "SERVER_ERROR") {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    if (update.status === "pending") return;

    await update.mutateAsync({
      name: data?.name,
      type: data.type?.[0]?.value ?? FIELD_TYPE.TEXT_SHORT,
      configuration: {
        required: data?.configuration?.required ?? false,
        multiple: data?.configuration?.multiple ?? false,
        listing: data?.configuration?.listing ?? false,
        filtering: data?.configuration?.filtering ?? false,
        format: null,
        defaultValue: data?.configuration?.defaultValue ?? null,
        dropdown: null,
        relationship: null,
        group: data?.configuration?.group ?? null,
        category: data?.configuration?.category ?? null,

        ...(data?.configuration?.format && {
          format: data?.configuration?.format?.[0]?.value,
        }),

        ...(data?.configuration?.dropdown && {
          dropdown: data?.configuration?.dropdown?.map(
            (item: Option) => item.value
          ),
        }),

        ...(data?.configuration?.relationship && {
          relationship: {
            ...data?.configuration?.relationship,
            table: {
              ...data?.configuration?.relationship?.table,
              _id: data?.configuration?.relationship?.table?._id?.[0]?.value,
            },
            field: {
              ...data?.configuration?.relationship?.field,
              _id: data?.configuration?.relationship?.field?._id?.[0]?.value,
            },
            order: data?.configuration?.relationship?.order?.[0]?.value,
          },
        }),
      },

      trashed: data?.trashed ?? false,
      trashedAt: data?.trashedAt ?? null,
    });
  });

  const selectedOption = form.watch("type");

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

  const COLUMN_TEXT_SHORT_FORMAT_LIST = [
    {
      label: t("FIELD_FORMAT_ALPHANUMERIC_LABEL", "Alfanumérico") as string,
      value: FIELD_FORMAT.ALPHA_NUMERIC,
    },
    {
      label: t("FIELD_FORMAT_INTEGER_LABEL", "Inteiro") as string,
      value: FIELD_FORMAT.INTEGER,
    },
    {
      label: t("FIELD_FORMAT_DECIMAL_LABEL", "Decimal") as string,
      value: FIELD_FORMAT.DECIMAL,
    },
    {
      label: t("FIELD_FORMAT_URL_LABEL", "URL") as string,
      value: FIELD_FORMAT.URL,
    },
    {
      label: t("FIELD_FORMAT_EMAIL_LABEL", "E-mail") as string,
      value: FIELD_FORMAT.EMAIL,
    },
  ];

  const ORDER_LIST = [
    {
      label: t("FIELD_ORDER_ASCENDING_LABEL", "Ascendente") as string,
      value: "asc",
    },
    {
      label: t("FIELD_ORDER_DESCENDING_LABEL", "Descendente") as string,
      value: "desc",
    },
  ];

  const COLUMN_DATE_FORMAT_LIST = [
    {
      label: "DD/MM/AAAA",
      value: FIELD_FORMAT["DD_MM_YYYY"],
    },
    {
      label: "MM/DD/AAAA",
      value: FIELD_FORMAT["MM_DD_YYYY"],
    },
    {
      label: "AAAA/MM/DD",
      value: FIELD_FORMAT["YYYY_MM_DD"],
    },
    {
      label: "DD/MM/AAAA hh:mm:ss",
      value: FIELD_FORMAT["DD_MM_YYYY_HH_MM_SS"],
    },
    {
      label: "MM/DD/AAAA hh:mm:ss",
      value: FIELD_FORMAT["MM_DD_YYYY_HH_MM_SS"],
    },
    {
      label: "AAAA/MM/DD hh:mm:ss",
      value: FIELD_FORMAT["YYYY_MM_DD_HH_MM_SS"],
    },
    {
      label: "DD-MM-AAAA",
      value: FIELD_FORMAT["DD_MM_YYYY_DASH"],
    },
    {
      label: "MM-DD-AAAA",
      value: FIELD_FORMAT["MM_DD_YYYY_DASH"],
    },
    {
      label: "AAAA-MM-DD",
      value: FIELD_FORMAT["YYYY_MM_DD_DASH"],
    },
    {
      label: "DD-MM-AAAA hh:mm:ss",
      value: FIELD_FORMAT["DD_MM_YYYY_HH_MM_SS_DASH"],
    },
    {
      label: "MM-DD-AAAA hh:mm:ss",
      value: FIELD_FORMAT["MM_DD_YYYY_HH_MM_SS_DASH"],
    },
    {
      label: "AAAA-MM-DD hh:mm:ss",
      value: FIELD_FORMAT["YYYY_MM_DD_HH_MM_SS_DASH"],
    },
  ];

  const type = {
    value: selectedOption?.[0]?.value,
    label: selectedOption?.[0]?.label,
  };

  return (
    <Root {...form}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <FieldTableName required defaultValue={field.name} />
        <FieldTableType
          required
          disabled
          defaultValue={
            COLUMN_TYPE_LIST?.filter((type) => field?.type === type.value) ?? []
          }
        />

        {type.value === FIELD_TYPE.TEXT_SHORT && (
          <FieldTableTextShortFormat
            required={type.value === FIELD_TYPE.TEXT_SHORT}
            defaultValue={COLUMN_TEXT_SHORT_FORMAT_LIST?.filter(
              (format) => field?.configuration?.format === format.value
            )}
          />
        )}

        {type.value === FIELD_TYPE.TEXT_SHORT && (
          <FieldTableTextShortDefaultValue
            defaultValue={field?.configuration?.defaultValue ?? ""}
          />
        )}

        {type.value === FIELD_TYPE.TEXT_LONG && (
          <FieldTableTextLongDefaultValue
            defaultValue={field?.configuration?.defaultValue ?? ""}
          />
        )}

        {type.value === FIELD_TYPE.DROPDOWN && (
          <FieldTableDropdown
            required={type.value === FIELD_TYPE.DROPDOWN}
            defaultValue={field?.configuration?.dropdown?.map((option) => ({
              label: option,
              value: option,
            }))}
          />
        )}

        {type.value === FIELD_TYPE.RELATIONSHIP && (
          <FieldTableRelationship
            required={[FIELD_TYPE.RELATIONSHIP].includes(type.value)}
            defaultValue={[
              {
                value: field?.configuration?.relationship?.table?._id || "",
                label: "",
                slug: field?.configuration?.relationship?.table?.slug || "",
              },
            ]}
          />
        )}

        {(field?.configuration?.relationship?.table?._id ||
          form.watch("configuration.relationship.table._id")) &&
          type.value === FIELD_TYPE.RELATIONSHIP && (
            <FieldTableRelationshipView
              required={Boolean(
                field?.configuration?.relationship?.table?._id ||
                  form.watch("configuration.relationship.table._id")
              )}
              defaultValue={[
                {
                  value: field?.configuration?.relationship?.field?._id || "",
                  label: "",
                  slug: field?.configuration?.relationship?.field?.slug || "",
                },
              ]}
            />
          )}

        {type.value === FIELD_TYPE.RELATIONSHIP && (
          <FieldTableRelationshipOrder
            required={[FIELD_TYPE.RELATIONSHIP].includes(type.value)}
            defaultValue={ORDER_LIST?.filter(
              (order) =>
                field?.configuration?.relationship?.order === order.value
            )}
          />
        )}

        {type.value === FIELD_TYPE.DATE && (
          <FieldTableDateFormat
            required={type.value === FIELD_TYPE.DATE}
            defaultValue={COLUMN_DATE_FORMAT_LIST?.filter(
              (format) => field?.configuration?.format === format.value
            )}
          />
        )}

        {[FIELD_TYPE.CATEGORY].includes(type.value) && (
          <FieldTableCategory
            required={[FIELD_TYPE.CATEGORY].includes(type.value)}
            defaultValue={field?.configuration?.category ?? []}
          />
        )}

        {[
          FIELD_TYPE.DROPDOWN,
          FIELD_TYPE.FILE,
          FIELD_TYPE.RELATIONSHIP,
          FIELD_TYPE.FIELD_GROUP,
          FIELD_TYPE.CATEGORY,
        ].includes(type.value) && (
          <FieldTableMultiple
            defaultValue={field?.configuration?.multiple ?? false}
          />
        )}

        {![FIELD_TYPE.REACTION, FIELD_TYPE.FILE].includes(type.value) && (
          <FieldTableFiltering
            defaultValue={field?.configuration?.filtering ?? false}
          />
        )}

        <FieldTableListing
          defaultValue={field?.configuration?.listing ?? false}
        />

        {![FIELD_TYPE.REACTION, FIELD_TYPE.EVALUATION].includes(type.value) && (
          <FieldTableRequired
            defaultValue={field?.configuration?.required ?? false}
          />
        )}

        <FieldTableTrashed defaultValue={Boolean(field?.trashed)} />

        <Button
          className="w-full"
          type="submit"
          disabled={update.status === "pending"}
        >
          {update.status === "pending" && (
            <LoaderCircleIcon className="size-4 animate-spin" />
          )}
          {!(update.status === "pending") && (
            <span>{t("BUTTON_UPDATE_LABEL", "Atualizar")}</span>
          )}
        </Button>
      </form>
    </Root>
  );
}

export function FieldTableUpdateSheet({
  _id,
  ...props
}: React.ComponentProps<typeof SheetTrigger> & {
  _id: string;
}) {
  const { t } = useI18n();
  const management = useTableManagement();

  const [open, setOpen] = React.useState(false);

  const field = useQuery({
    queryKey: [
      "/tables/".concat(management.slug).concat("/fields/").concat(_id),
      _id,
    ],
    queryFn: async function () {
      const route = "/tables/"
        .concat(management.slug)
        .concat("/fields/")
        .concat(_id);
      const response = await API.get<Field>(route);
      return response.data;
    },
    enabled: Boolean(management.slug) && Boolean(_id) && open,
  });

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          management.reset();
        }
        setOpen(o);
      }}
    >
      <SheetTrigger className="hidden" {...props} />
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_UPDATE_TITLE",
              "Atualizar Campo"
            )}
          </SheetTitle>

          <SheetDescription>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_UPDATE_DESCRIPTION",
              "Atualize os detalhes do campo"
            )}
          </SheetDescription>
        </SheetHeader>

        {field.status === "success" && (
          <FieldTableUpdateForm
            field={field.data}
            onClose={() => {
              management.reset();
              setOpen(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
