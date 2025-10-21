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
  type Collection,
  type Field,
  type Paginated,
  type Row,
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
import { RowCollectionCategory } from "./_row/row-collection-category";
import { RowCollectionDate } from "./_row/row-collection-date";
import { RowCollectionDropdown } from "./_row/row-collection-dropdown";
import { RowCollectionFieldGroup } from "./_row/row-collection-field-group";
import { RowCollectionFile } from "./_row/row-collection-file";
import { RowCollectionRelationship } from "./_row/row-collection-relationship";
import { RowCollectionTextLong } from "./_row/row-collection-text-long";
import { RowCollectionTextShort } from "./_row/row-collection-text-short";

interface Props {
  fields: Field[];
  onClose: () => void;
  order: string[];
  row: Row;
}

function CollectionRowUpdateForm({ fields, order, onClose, row }: Props) {
  const { t } = useI18n();

  // const form = useForm({
  //   defaultValues: React.useMemo(() => {
  //     const defaultValues: Record<string, any> = {};

  //     fields?.forEach((field) => {
  //       const value = row[field.slug];

  //       if (field.type === FIELD_TYPE.DATE && value) {
  //         defaultValues[field.slug] = new Date(value);
  //       } else if (field.type === FIELD_TYPE.FILE && value) {
  //         defaultValues[field.slug] = Array.isArray(value)
  //           ? value.map((file: any) => file._id)
  //           : [];
  //       } else if (field.type === FIELD_TYPE.DROPDOWN && value) {
  //         defaultValues[field.slug] = Array.from<string>(value);
  //       } else if (field.type === FIELD_TYPE.RELATIONSHIP && value) {
  //         defaultValues[field.slug] = Array.from<any>(value).map(
  //           (r: any) => r._id
  //         );
  //       } else if (value !== undefined && value !== null) {
  //         defaultValues[field.slug] = value;
  //       }
  //     });

  //     return defaultValues;
  //   }, [fields, row]),
  // });

  const form = useForm();

  const { slug } = useParams({
    from: "/_private/collections/$slug/",
  });

  const search = useSearch({
    from: "/_private/collections/$slug/",
  });

  const update = useMutation({
    mutationFn: async (payload: Partial<Row>) => {
      const route = "/collections/"
        .concat(slug)
        .concat("/rows/")
        .concat(row._id);
      const response = await API.put<Row>(route, payload);
      return response.data;
    },
    onSuccess: (data) => {
      onClose();

      const queryKey = [
        "/collections/".concat(slug).concat("/rows/paginated"),
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
        "/collections/".concat(slug).concat("/rows/").concat(data._id),
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
          toast.error(data?.message ?? "Erro de validação");
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
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
                  <RowCollectionTextShort
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
                  <RowCollectionTextLong
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
                  <RowCollectionDropdown
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
                  <RowCollectionFile
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
                  <RowCollectionDate
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
                  <RowCollectionCategory
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
                  <RowCollectionRelationship
                    field={field}
                    key={field._id}
                    required={field?.configuration?.required}
                    relation={{
                      slug:
                        field?.configuration?.relationship?.collection?.slug ||
                        "",
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
                  <RowCollectionFieldGroup
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

export function RowCollectionUpdateSheet({
  _id,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger> & {
  _id: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  const { slug } = useParams({
    from: "/_private/collections/$slug/",
  });

  const collection = useQuery({
    queryKey: ["/collections/".concat(slug), slug],
    queryFn: async () => {
      const route = "/collections/".concat(slug);
      const response = await API.get<Collection>(route);
      return response.data;
    },
    enabled: Boolean(slug) && open,
  });

  const row = useQuery({
    queryKey: [
      "/collections/".concat(slug).concat("/rows/").concat(_id),
      slug,
      _id,
    ],
    queryFn: async () => {
      const route = "/collections/".concat(slug).concat("/rows/").concat(_id);
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
              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_UPDATE_TITLE",
              "Novo Registro"
            )}
          </SheetTitle>
          <SheetDescription>
            {t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_UPDATE_DESCRIPTION",
              "Adicione um novo registro para sua lista"
            )}
          </SheetDescription>
        </SheetHeader>

        {collection.status === "success" && row.status === "success" && (
          <CollectionRowUpdateForm
            fields={collection.data?.fields || []}
            onClose={() => setOpen(false)}
            order={collection.data?.configuration?.fields?.orderForm ?? []}
            row={row.data}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
