import { Button } from "@/components/ui/button";
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
  FIELD_TYPE,
  type Field,
  type Paginated,
  type Row,
  type Table,
} from "@/lib/entity";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import { LoaderCircleIcon } from "lucide-react";

import { Form } from "@/components/ui/form";
import { QueryClient } from "@/lib/query-client";
import { AxiosError } from "axios";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { RowTableCategory } from "./_row/row-table-category";
import { RowTableDate } from "./_row/row-table-date";
import { RowTableDropdown } from "./_row/row-table-dropdown";
import { RowTableFieldGroup } from "./_row/row-table-field-group";
import { RowTableFile } from "./_row/row-table-file";
import { RowTableRelationship } from "./_row/row-table-relationship";
import { RowTableTextLong } from "./_row/row-table-text-long";
import { RowTableTextShort } from "./_row/row-table-text-short";

interface Props {
  fields: Field[];
  onClose: () => void;
  order: string[];
  row: Row;
}

function TableRowUpdateForm({ fields, order, onClose, row }: Props) {
  const { t } = useI18n();

  const form = useForm();

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const search = useSearch({
    from: "/_private/tables/$slug/",
  });

  const update = useMutation({
    mutationFn: async (payload: Partial<Row>) => {
      const route = "/tables/".concat(slug).concat("/rows/").concat(row._id);
      const response = await API.put<Row>(route, payload);
      return response.data;
    },
    onSuccess: (data) => {
      onClose();

      const queryKey = [
        "/tables/".concat(slug).concat("/rows/paginated"),
        slug,
        search,
      ];

      QueryClient.setQueryData<Paginated<Row[]>>(queryKey, (old) => {
        if (!old) return old;

        return {
          meta: old.meta,
          data: old.data.map((item) => {
            if (item._id === data._id) {
              return data;
            }
            return item;
          }),
        };
      });

      const individualRowQueryKey = [
        "/tables/".concat(slug).concat("/rows/").concat(data._id),
        slug,
        data._id,
      ];
      QueryClient.setQueryData<Row>(individualRowQueryKey, data);

      toast("Registro atualizado!", {
        className: "!bg-green-600 !text-white !border-green-600",
        description: "O registro foi atualizado com sucesso",
        descriptionClassName: "!text-white",
        closeButton: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(data?.message ?? "Dados inválidos");
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Acesso negado");
        }

        // 404 - ROW_NOT_FOUND
        if (data?.code === 404 && data?.cause === "ROW_NOT_FOUND") {
          toast.error(data?.message ?? "Registro não encontrado");
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(
            data?.message ?? t("VALIDATION_ERROR_DATA", "Erro de validação")
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(
            data?.message ??
              t("VALIDATION_ERROR_SERVER", "Erro interno do servidor")
          );
        }
      }

      console.error(error);
    },
  });

  const onSubmit = form.handleSubmit(async (payload) => {
    if (update.status === "pending") return;
    await update.mutateAsync(payload);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
        <section className="flex flex-col gap-4">
          {fields
            ?.filter((field) => !field.trashed)
            ?.sort((a, b) => {
              return order.indexOf(a._id) - order.indexOf(b._id);
            })
            .map((field) => {
              if (field?.type === FIELD_TYPE.TEXT_SHORT)
                return (
                  <RowTableTextShort
                    key={field._id}
                    field={field}
                    required={field?.configuration?.required}
                    defaultValue={
                      (row[field.slug] || field?.configuration?.defaultValue) ??
                      undefined
                    }
                  />
                );

              if (field?.type === FIELD_TYPE.TEXT_LONG)
                return (
                  <RowTableTextLong
                    key={field._id}
                    field={field}
                    required={field?.configuration?.required}
                    defaultValue={
                      (row[field.slug] || field?.configuration?.defaultValue) ??
                      undefined
                    }
                  />
                );

              if (field?.type === FIELD_TYPE.DROPDOWN) {
                const defaultValue =
                  Array.from<string>(row[field.slug]).map((item) => ({
                    label: item,
                    value: item,
                  })) ?? [];
                return (
                  <RowTableDropdown
                    field={field}
                    key={field._id}
                    required={field?.configuration?.required}
                    isMultiple={field?.configuration?.multiple}
                    defaultValue={defaultValue}
                  />
                );
              }

              if (field?.type === FIELD_TYPE.FILE) {
                const MAX_SIZE = 10 * 1024 * 1024;

                return (
                  <RowTableFile
                    key={field._id}
                    dropzoneOptions={{
                      multiple: field?.configuration?.multiple,
                      maxFiles: 10,
                      maxSize: MAX_SIZE,
                      accept: {
                        "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
                        "application/*": [
                          ".pdf",
                          ".doc",
                          ".docx",
                          ".xls",
                          ".xlsx",
                        ],
                        "text/*": [".csv", ".txt"],
                      },
                    }}
                    field={field}
                    required={field?.configuration?.required}
                    defaultValue={row[field.slug]}
                  />
                );
              }

              if (field?.type === FIELD_TYPE.DATE) {
                return (
                  <RowTableDate
                    key={field._id}
                    field={field}
                    required={field?.configuration?.required}
                    defaultValue={
                      row[field.slug] ? new Date(row[field.slug]) : undefined
                    }
                  />
                );
              }

              if (field?.type === FIELD_TYPE.CATEGORY) {
                return (
                  <RowTableCategory
                    key={field._id}
                    field={field}
                    required={field?.configuration?.required}
                    isMultiple={field?.configuration?.multiple}
                    defaultValue={row[field.slug]}
                  />
                );
              }

              if (field?.type === FIELD_TYPE.RELATIONSHIP) {
                const defaultValue = Array.from<Row>(row[field.slug]).map(
                  (r) => ({
                    label:
                      r?.[
                        field?.configuration?.relationship?.field?.slug ?? ""
                      ] ?? "",
                    value: r?.["_id"],
                  })
                );
                return (
                  <RowTableRelationship
                    field={field}
                    key={field._id}
                    required={field?.configuration?.required}
                    relation={{
                      slug:
                        field?.configuration?.relationship?.table?.slug || "",
                      field:
                        field?.configuration?.relationship?.field?.slug || "",
                    }}
                    isMultiple={field?.configuration?.multiple}
                    defaultValue={defaultValue}
                  />
                );
              }

              if (field?.type === FIELD_TYPE.FIELD_GROUP) {
                return (
                  <RowTableFieldGroup
                    key={field._id}
                    field={field}
                    required={field?.configuration?.required}
                    defaultValue={row[field.slug]}
                  />
                );
              }
            })}
        </section>

        <Button className="w-full">
          {update.status === "pending" && (
            <LoaderCircleIcon className="size-4 animate-spin" />
          )}
          {!(update.status === "pending") && (
            <span>{t("BUTTON_UPDATE_LABEL", "Atualizar")}</span>
          )}
        </Button>
      </form>
    </Form>
  );
}

export function RowTableUpdateSheet({
  _id,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger> & {
  _id: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const table = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(slug) && open,
  });

  const row = useQuery({
    queryKey: ["/tables/".concat(slug).concat("/rows/").concat(_id), slug, _id],
    queryFn: async () => {
      const route = "/tables/".concat(slug).concat("/rows/").concat(_id);
      const response = await API.get(route);
      return response.data;
    },
    enabled: Boolean(slug) && Boolean(_id) && open,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="hidden" {...props} />
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_UPDATE_TITLE",
              t("SHEET_TITLE_NEW_RECORD", "Novo Registro")
            )}
          </SheetTitle>
          <SheetDescription>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_UPDATE_DESCRIPTION",
              "Adicione um novo registro para sua lista"
            )}
          </SheetDescription>
        </SheetHeader>

        {table.status === "success" && row.status === "success" && (
          <TableRowUpdateForm
            fields={table.data?.fields || []}
            onClose={() => setOpen(false)}
            order={table.data?.configuration?.fields?.orderForm ?? []}
            row={row.data}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
