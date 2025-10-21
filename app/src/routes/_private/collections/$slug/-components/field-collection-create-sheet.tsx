/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { Option } from "@/components/custom/multi-selector";
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
import { useCollectionManagement } from "@/hooks/collection-management.hook";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import {
  FIELD_TYPE,
  type Collection,
  type Field,
  type Paginated,
  type Row,
} from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { LoaderCircleIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldCollectionCategory } from "./_field/field-collection-category";
import { FieldCollectionDateFormat } from "./_field/field-collection-date-format";
import { FieldCollectionDropdown } from "./_field/field-collection-dropdown";
import { FieldCollectionFiltering } from "./_field/field-collection-filtering";
import { FieldCollectionListing } from "./_field/field-collection-listing";
import { FieldCollectionMultiple } from "./_field/field-collection-multiple";
import { FieldCollectionName } from "./_field/field-collection-name";
import { FieldCollectionRelationship } from "./_field/field-collection-relationship";
import { FieldCollectionRelationshipOrder } from "./_field/field-collection-relationship-order";
import { FieldCollectionRelationshipView } from "./_field/field-collection-relationship-view";
import { FieldCollectionRequired } from "./_field/field-collection-required";
import { FieldCollectionTextLongDefaultValue } from "./_field/field-collection-text-long-default-value";
import { FieldCollectionTextShortDefaultValue } from "./_field/field-collection-text-short-default-value";
import { FieldCollectionTextShortFormat } from "./_field/field-collection-text-short-format";
import { FieldCollectionType } from "./_field/field-collection-type";

export function CreateFieldCollectionForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const { t } = useI18n();
  const management = useCollectionManagement();

  const search = useSearch({
    strict: false,
  });

  const isGroupField = search["field-type"] === "group";
  const isCreateAction = search.action === "create";

  const form = useForm();

  const create = useMutation({
    mutationFn: async function (payload: Partial<Field>) {
      const route = "/collections/".concat(management.slug).concat("/fields");
      const response = await API.post<Field>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      QueryClient.setQueryData<Collection>(
        ["/collections/".concat(management.slug), management.slug],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: [...old.fields, data],
          };
        }
      );

      QueryClient.setQueryData<Paginated<Collection[]>>(
        ["/collections/paginated", search],
        (old) => {
          if (!old) return old;

          return {
            meta: old.meta,
            data: old.data.map((collection) => {
              if (collection.slug === management.slug) {
                return {
                  ...collection,
                  fields: [...collection.fields, data],
                };
              }
              return collection;
            }),
          };
        }
      );

      QueryClient.setQueryData<Paginated<Row[]>>(
        [
          "/collections/".concat(management.slug).concat("/rows/paginated"),
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
          toast.error(data?.message ?? "Nome e tipo do campo são obrigatórios");
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

        // 404 - COLLECTION_NOT_FOUND
        if (data?.code === 404 && data?.cause === "COLLECTION_NOT_FOUND") {
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
          toast.error(data?.message ?? "Erro interno do servidor");
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
            collection: {
              ...data?.configuration?.relationship?.collection,
              _id: data?.configuration?.relationship?.collection?._id?.[0]
                ?.value,
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
          label: t("COLLECTION_FIELD_GROUP_LABEL", "Field group"),
          value: FIELD_TYPE.FIELD_GROUP,
        },
      ]);
    }
  }, [form, isCreateAction, isGroupField, t]);

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <FieldCollectionName required />
        <FieldCollectionType required />

        {type.value === FIELD_TYPE.TEXT_SHORT && (
          <FieldCollectionTextShortFormat
            required={type.value === FIELD_TYPE.TEXT_SHORT}
          />
        )}

        {type.value === FIELD_TYPE.TEXT_SHORT && (
          <FieldCollectionTextShortDefaultValue />
        )}

        {type.value === FIELD_TYPE.TEXT_LONG && (
          <FieldCollectionTextLongDefaultValue />
        )}

        {type.value === FIELD_TYPE.DROPDOWN && (
          <FieldCollectionDropdown
            required={type.value === FIELD_TYPE.DROPDOWN}
          />
        )}

        {type.value === FIELD_TYPE.RELATIONSHIP && (
          <FieldCollectionRelationship
            required={[FIELD_TYPE.RELATIONSHIP].includes(type.value)}
          />
        )}

        {form.watch("configuration.relationship.collection._id") &&
          type.value === FIELD_TYPE.RELATIONSHIP && (
            <FieldCollectionRelationshipView
              required={
                !!form.watch("configuration.relationship.collection._id")
              }
            />
          )}

        {type.value === FIELD_TYPE.RELATIONSHIP && (
          <FieldCollectionRelationshipOrder
            required={[FIELD_TYPE.RELATIONSHIP].includes(type.value)}
          />
        )}

        {type.value === FIELD_TYPE.DATE && (
          <FieldCollectionDateFormat
            required={type.value === FIELD_TYPE.DATE}
          />
        )}

        {[FIELD_TYPE.CATEGORY].includes(type.value) && (
          <FieldCollectionCategory
            required={[FIELD_TYPE.CATEGORY].includes(type.value)}
          />
        )}

        {[
          FIELD_TYPE.DROPDOWN,
          FIELD_TYPE.FILE,
          FIELD_TYPE.RELATIONSHIP,
          FIELD_TYPE.FIELD_GROUP,
          FIELD_TYPE.CATEGORY,
        ].includes(type.value) && <FieldCollectionMultiple />}

        {![FIELD_TYPE.REACTION, FIELD_TYPE.FILE].includes(type.value) && (
          <FieldCollectionFiltering />
        )}

        <FieldCollectionListing />

        {![FIELD_TYPE.REACTION, FIELD_TYPE.EVALUATION].includes(type.value) && (
          <FieldCollectionRequired />
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

export function FieldCollectionCreateSheet({
  ...props
}: React.ComponentProps<typeof SheetTrigger>) {
  const { t } = useI18n();

  const management = useCollectionManagement();

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
            {t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_CREATE_TITLE",
              "Novo Campo"
            )}
          </SheetTitle>
          <SheetDescription>
            {t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_CREATE_DESCRIPTION",
              "Configure e adicione um novo campo para sua lista"
            )}
          </SheetDescription>
        </SheetHeader>

        <CreateFieldCollectionForm
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
