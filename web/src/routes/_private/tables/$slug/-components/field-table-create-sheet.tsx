/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { Option } from "@/components/common/multi-selector";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/hooks/i18.hook";
import { useTableManagement } from "@/hooks/table-management.hook";
import { API } from "@/lib/api";
import {
  FIELD_TYPE,
  type Field,
  type Paginated,
  type Row,
  type Table,
} from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { LoaderCircleIcon } from "lucide-react";
import React from "react";
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
import { FieldTableType } from "./_field/field-table-type";

export function CreateFieldTableForm({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const management = useTableManagement();

  const search = useSearch({
    strict: false,
  });

  const isGroupField = search["field-type"] === "group";
  const isCreateAction = search.action === "create";

  const form = useForm();

  const create = useMutation({
    mutationFn: async function (payload: Partial<Field>) {
      const route = "/tables/".concat(management.slug).concat("/fields");
      const response = await API.post<Field>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      QueryClient.setQueryData<Table>(
        ["/tables/".concat(management.slug), management.slug],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: [...old.fields, data],
            configuration: {
              ...old.configuration,
              fields: {
                ...old.configuration.fields,
                orderForm: [...old.configuration.fields.orderForm, data.slug],
                orderList: [...old.configuration.fields.orderList, data.slug],
              },
            },
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
                  // fields: [...table.fields, data],
                  fields: [...table.fields, data],
                  configuration: {
                    ...table.configuration,
                    fields: {
                      ...table.configuration.fields,
                      orderForm: [
                        ...table.configuration.fields.orderForm,
                        data.slug,
                      ],
                      orderList: [
                        ...table.configuration.fields.orderList,
                        data.slug,
                      ],
                    },
                  },
                };
              }
              return table;
            }),
          };
        }
      );

      QueryClient.setQueryData<Paginated<Row[]>>(
        [
          "/tables/".concat(management.slug).concat("/rows/paginated"),
          management.slug,
          search,
        ],
        (old) => {
          if (!old) return old;

          return {
            meta: old.meta,
            data: old.data.map((row) => ({
              ...row,
              [data.slug]: null,
            })),
          };
        }
      );

      onClose();
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(data?.message ?? t("ERROR_FIELD_NAME_TYPE_REQUIRED", "Nome e tipo do campo são obrigatórios"));
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ??
              "Permissões insuficientes para criar campos nesta coleção"
          );
        }

        // 404 - TABLE_NOT_FOUND
        if (data?.code === 404 && data?.cause === "TABLE_NOT_FOUND") {
          toast.error(data?.message ?? "Coleção não encontrada");
        }

        // 409 - FIELD_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "FIELD_ALREADY_EXISTS") {
          form.setError("name", {
            message:
              data?.message ?? "Campo com este nome já existe na coleção",
          });
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(data?.message ?? "Configuração de campo inválida");
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500 && data?.cause === "SERVER_ERROR") {
          toast.error(data?.message ?? t("ERROR_SERVER_ERROR", "Erro interno do servidor"));
        }
      }

      console.error(error);
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    if (create.status === "pending") return;

    const fieldType = data.type?.[0]?.value ?? FIELD_TYPE.TEXT_SHORT;

    await create.mutateAsync({
      name: data?.name,
      type: fieldType,
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
    });
  });

  const selectedOption = form.watch("type");

  const type = {
    value: selectedOption?.[0]?.value,
    label: selectedOption?.[0]?.label,
  };

  React.useEffect(() => {
    if (isCreateAction && isGroupField) {
      form.setValue("type", [
        {
          label: t("TABLE_FIELD_GROUP_LABEL", "Field group"),
          value: FIELD_TYPE.FIELD_GROUP,
        },
      ]);
    }
  }, [form, isCreateAction, isGroupField, t]);

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <FieldTableName required />
        <FieldTableType required />

        {type.value === FIELD_TYPE.TEXT_SHORT && (
          <FieldTableTextShortFormat
            required={type.value === FIELD_TYPE.TEXT_SHORT}
          />
        )}

        {type.value === FIELD_TYPE.TEXT_SHORT && (
          <FieldTableTextShortDefaultValue />
        )}

        {type.value === FIELD_TYPE.TEXT_LONG && (
          <FieldTableTextLongDefaultValue />
        )}

        {type.value === FIELD_TYPE.DROPDOWN && (
          <FieldTableDropdown required={type.value === FIELD_TYPE.DROPDOWN} />
        )}

        {type.value === FIELD_TYPE.RELATIONSHIP && (
          <FieldTableRelationship
            required={[FIELD_TYPE.RELATIONSHIP].includes(type.value)}
          />
        )}

        {form.watch("configuration.relationship.table._id") &&
          type.value === FIELD_TYPE.RELATIONSHIP && (
            <FieldTableRelationshipView
              required={!!form.watch("configuration.relationship.table._id")}
            />
          )}

        {type.value === FIELD_TYPE.RELATIONSHIP && (
          <FieldTableRelationshipOrder
            required={[FIELD_TYPE.RELATIONSHIP].includes(type.value)}
          />
        )}

        {type.value === FIELD_TYPE.DATE && (
          <FieldTableDateFormat required={type.value === FIELD_TYPE.DATE} />
        )}

        {[FIELD_TYPE.CATEGORY].includes(type.value) && (
          <FieldTableCategory
            required={[FIELD_TYPE.CATEGORY].includes(type.value)}
          />
        )}

        {[
          FIELD_TYPE.DROPDOWN,
          FIELD_TYPE.FILE,
          FIELD_TYPE.RELATIONSHIP,
          FIELD_TYPE.FIELD_GROUP,
          FIELD_TYPE.CATEGORY,
        ].includes(type.value) && <FieldTableMultiple />}

        {![FIELD_TYPE.REACTION, FIELD_TYPE.FILE].includes(type.value) && (
          <FieldTableFiltering />
        )}

        <FieldTableListing />

        {![FIELD_TYPE.REACTION, FIELD_TYPE.EVALUATION].includes(type.value) && (
          <FieldTableRequired />
        )}

        <Button
          className="w-full"
          type="submit"
          disabled={create.status === "pending"}
        >
          {create.status === "pending" && (
            <LoaderCircleIcon className="size-4 animate-spin" />
          )}
          {!(create.status === "pending") && (
            <span>{t("BUTTON_CREATE_LABEL", "Criar")}</span>
          )}
        </Button>
      </form>
    </Form>
  );
}

export function FieldTableCreateSheet({
  ...props
}: React.ComponentProps<typeof SheetTrigger>) {
  const { t } = useI18n();

  const management = useTableManagement();

  const router = useRouter();

  const [open, setOpen] = React.useState(false);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          management.reset();
          router.navigate({
            // @ts-ignore
            search: (prev) => {
              const { "field-type": field_type, action, ...rest } = prev;
              console.info(field_type, action);
              return rest;
            },
            replace: true,
          });
        }

        setOpen(o);
      }}
    >
      <SheetTrigger className="hidden" {...props} />

      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t("TABLE_ROUTE_SHEET_INTERNAL_FIELD_CREATE_TITLE", "Novo Campo")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_CREATE_DESCRIPTION",
              "Configure e adicione um novo campo para sua lista"
            )}
          </SheetDescription>
        </SheetHeader>

        <CreateFieldTableForm
          onClose={() => {
            management.reset();

            router.navigate({
              // @ts-ignore
              search: (prev) => {
                const { "field-type": field_type, action, ...rest } = prev;
                console.info(field_type, action);
                return rest;
              },
              replace: true,
            });

            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
