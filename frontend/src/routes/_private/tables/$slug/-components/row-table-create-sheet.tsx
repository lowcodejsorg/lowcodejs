import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthentication } from "@/hooks/authentication.hook";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import {
  FIELD_TYPE,
  type Field,
  type Paginated,
  type Row,
  type Table,
} from "@/lib/entity";
import { cn, MetaDefault } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";

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
}

function RowTableCreateForm({ fields, order, onClose }: Props) {
  const { t } = useI18n();

  const form = useForm();

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const search = useSearch({
    from: "/_private/tables/$slug/",
  });

  const create = useMutation({
    mutationFn: async (payload: Partial<Row>) => {
      const route = "/tables/".concat(slug).concat("/rows");
      const response = await API.post<Row>(route, payload);
      return response.data;
    },
    onSuccess: (data) => {
      onClose();

      QueryClient.setQueryData<Paginated<Row[]>>(
        ["/tables/".concat(slug).concat("/rows/paginated"), slug, search],
        (old) => {
          if (!old) {
            return {
              meta: MetaDefault,
              data: [data],
            };
          }

          return {
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
            data: [data, ...old.data],
          };
        }
      );

      toast("Registro criado!", {
        className: "!bg-green-600 !text-white !border-green-600",
        description: "O registro foi criado com sucesso",
        descriptionClassName: "!text-white",
        closeButton: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ?? "ID da coleção e dados são obrigatórios"
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ??
              "Permissões insuficientes para criar registros nesta coleção"
          );
        }

        // 404 - TABLE_NOT_FOUND
        if (data?.code === 404 && data?.cause === "TABLE_NOT_FOUND") {
          toast.error(data?.message ?? "Coleção não encontrada");
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(data?.message ?? t("ROW_ERROR_VALIDATION_DATA", "Erro de validação nos dados"));
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500 && data?.cause === "SERVER_ERROR") {
          toast.error(data?.message ?? t("VALIDATION_ERROR_SERVER", "Erro interno do servidor"));
        }
      }

      console.error(error);
    },
  });

  const onSubmit = form.handleSubmit(async (payload) => {
    if (create.status === "pending") return;
    await create.mutateAsync(payload);
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
                      field?.configuration?.defaultValue ?? undefined
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
                      field?.configuration?.defaultValue ?? undefined
                    }
                  />
                );

              if (field?.type === FIELD_TYPE.DROPDOWN)
                return (
                  <RowTableDropdown
                    field={field}
                    key={field._id}
                    required={field?.configuration?.required}
                    isMultiple={field?.configuration?.multiple}
                  />
                );

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
                  />
                );
              }

              if (field?.type === FIELD_TYPE.DATE) {
                return (
                  <RowTableDate
                    key={field._id}
                    field={field}
                    required={field?.configuration?.required}
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
                  />
                );
              }

              if (field?.type === FIELD_TYPE.RELATIONSHIP) {
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
                  />
                );
              }

              if (field?.type === FIELD_TYPE.FIELD_GROUP) {
                return (
                  <RowTableFieldGroup
                    key={field._id}
                    field={field}
                    required={field?.configuration?.required}
                  />
                );
              }
            })}
        </section>

        <Button className="w-full">
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

export function RowTableCreateSheet() {
  const { t } = useI18n();
  const { verify } = useAuthentication();
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className={cn(
            "py-1 px-2 h-auto inline-flex gap-1 bg-primary/80 hover:bg-primary text-primary-foreground hover:text-primary-foreground/80",
            !verify({
              resource: "create-row",
              owner: table?.data?.configuration?.owner?._id,
              administrators:
                table?.data?.configuration?.administrators?.flatMap((a) =>
                  a._id?.toString()
                ),
            }) && "hidden"
          )}
          disabled={
            table.status === "success" && table?.data?.fields?.length === 0
          }
          variant="outline"
        >
          <PlusIcon className="size-4" />
          <span>
            {t("TABLE_INTERNAL_REGISTER_BUTTON_CREATE_LABEL", "Registro")}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_CREATE_TITLE",
              t("SHEET_TITLE_NEW_RECORD", "Novo Registro")
            )}
          </SheetTitle>
          <SheetDescription>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_CREATE_DESCRIPTION",
              "Adicione um novo registro para sua lista"
            )}
          </SheetDescription>
        </SheetHeader>

        {table.status === "success" && (
          <RowTableCreateForm
            fields={table.data?.fields || []}
            onClose={() => setOpen(false)}
            order={table.data?.configuration?.fields?.orderForm ?? []}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
