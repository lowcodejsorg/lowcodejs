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
  type Collection,
  type Field,
  type Paginated,
} from "@/lib/entity";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import React from "react";

import { Button } from "@/components/ui/button";
import { Form as Root } from "@/components/ui/form";

import type { Option } from "@/components/custom/multi-selector";
import { useCollectionManagement } from "@/hooks/collection-management.hook";
import { QueryClient } from "@/lib/query-client";
import { AxiosError } from "axios";
import { LoaderCircleIcon } from "lucide-react";
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
import { FieldCollectionTrashed } from "./_field/field-collection-trashed";
import { FieldCollectionType } from "./_field/field-collection-type";

export function FieldCollectionUpdateForm({
  field,
  onClose,
}: {
  field: Field;
  onClose: () => void;
}) {
  const { t } = useI18n();

  const management = useCollectionManagement();

  const search = useSearch({
    strict: false,
  });

  const form = useForm();

  const update = useMutation({
    mutationFn: async function (payload: Partial<Field>) {
      const route = "/collections/"
        .concat(management.slug)
        .concat("/fields/")
        .concat(field._id);
      const response = await API.put<Field>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      QueryClient.setQueryData<Field>(
        [
          "/collections/"
            .concat(management.slug)
            .concat("/fields/")
            .concat(data._id),
          data._id,
        ],
        data
      );

      QueryClient.setQueryData<Collection>(
        ["/collections/".concat(management.slug), management.slug],
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
                  fields: collection.fields.map((f) => {
                    if (f._id === data._id) {
                      return data;
                    }
                    return f;
                  }),
                };
              }
              return collection;
            }),
          };
        }
      );

      toast.success("Campo atualizado com sucesso");

      if (data.trashed) {
        toast.success(
          t(
            "COLLECTION_FIELD_SENT_TO_TRASH_MESSAGE",
            "Field sent to trash, to restore it, go to field management"
          )
        );
      }

      if (!data.trashed) {
        toast.success(
          t(
            "COLLECTION_FIELD_RESTORED_MESSAGE",
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
            data?.message ?? t("COLLECTION_ERROR_INVALID_DATA", "Invalid data")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t(
                "COLLECTION_ERROR_AUTHENTICATION_REQUIRED",
                "Authentication required"
              )
          );
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ??
              t(
                "COLLECTION_FIELD_ERROR_INSUFFICIENT_PERMISSIONS",
                "Insufficient permissions to update this field"
              )
          );
        }

        // 404 - FIELD_NOT_FOUND
        if (data?.code === 404 && data?.cause === "FIELD_NOT_FOUND") {
          toast.error(
            data?.message ??
              t("COLLECTION_FIELD_ERROR_NOT_FOUND", "Field not found")
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
                "COLLECTION_FIELD_ERROR_NAME_ALREADY_EXISTS",
                "Field with this name already exists"
              ),
          });
        }

        // 409 - FIELD_IN_USE
        if (data?.code === 409 && data?.cause === "FIELD_IN_USE") {
          toast.error(
            data?.message ??
              t(
                "COLLECTION_FIELD_ERROR_CANNOT_CHANGE_TYPE",
                "Cannot change field type: field contains data"
              )
          );
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(
            data?.message ??
              t(
                "COLLECTION_FIELD_ERROR_INVALID_CONFIGURATION",
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
      label: t("COLLECTION_FIELD_GROUP_LABEL", "Field group") as string,
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
        <FieldCollectionName required defaultValue={field.name} />
        <FieldCollectionType
          required
          disabled
          defaultValue={
            COLUMN_TYPE_LIST?.filter((type) => field?.type === type.value) ?? []
          }
        />

        {type.value === FIELD_TYPE.TEXT_SHORT && (
          <FieldCollectionTextShortFormat
            required={type.value === FIELD_TYPE.TEXT_SHORT}
            defaultValue={COLUMN_TEXT_SHORT_FORMAT_LIST?.filter(
              (format) => field?.configuration?.format === format.value
            )}
          />
        )}

        {type.value === FIELD_TYPE.TEXT_SHORT && (
          <FieldCollectionTextShortDefaultValue
            defaultValue={field?.configuration?.defaultValue ?? ""}
          />
        )}

        {type.value === FIELD_TYPE.TEXT_LONG && (
          <FieldCollectionTextLongDefaultValue
            defaultValue={field?.configuration?.defaultValue ?? ""}
          />
        )}

        {type.value === FIELD_TYPE.DROPDOWN && (
          <FieldCollectionDropdown
            required={type.value === FIELD_TYPE.DROPDOWN}
            defaultValue={field?.configuration?.dropdown?.map((option) => ({
              label: option,
              value: option,
            }))}
          />
        )}

        {type.value === FIELD_TYPE.RELATIONSHIP && (
          <FieldCollectionRelationship
            required={[FIELD_TYPE.RELATIONSHIP].includes(type.value)}
            defaultValue={[
              {
                value:
                  field?.configuration?.relationship?.collection?._id || "",
                label: "",
                slug:
                  field?.configuration?.relationship?.collection?.slug || "",
              },
            ]}
          />
        )}

        {(field?.configuration?.relationship?.collection?._id ||
          form.watch("configuration.relationship.collection._id")) &&
          type.value === FIELD_TYPE.RELATIONSHIP && (
            <FieldCollectionRelationshipView
              required={Boolean(
                field?.configuration?.relationship?.collection?._id ||
                  form.watch("configuration.relationship.collection._id")
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
          <FieldCollectionRelationshipOrder
            required={[FIELD_TYPE.RELATIONSHIP].includes(type.value)}
            defaultValue={ORDER_LIST?.filter(
              (order) =>
                field?.configuration?.relationship?.order === order.value
            )}
          />
        )}

        {type.value === FIELD_TYPE.DATE && (
          <FieldCollectionDateFormat
            required={type.value === FIELD_TYPE.DATE}
            defaultValue={COLUMN_DATE_FORMAT_LIST?.filter(
              (format) => field?.configuration?.format === format.value
            )}
          />
        )}

        {[FIELD_TYPE.CATEGORY].includes(type.value) && (
          <FieldCollectionCategory
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
          <FieldCollectionMultiple
            defaultValue={field?.configuration?.multiple ?? false}
          />
        )}

        {![FIELD_TYPE.REACTION, FIELD_TYPE.FILE].includes(type.value) && (
          <FieldCollectionFiltering
            defaultValue={field?.configuration?.filtering ?? false}
          />
        )}

        <FieldCollectionListing
          defaultValue={field?.configuration?.listing ?? false}
        />

        {![FIELD_TYPE.REACTION, FIELD_TYPE.EVALUATION].includes(type.value) && (
          <FieldCollectionRequired
            defaultValue={field?.configuration?.required ?? false}
          />
        )}

        <FieldCollectionTrashed defaultValue={Boolean(field?.trashed)} />

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

export function FieldCollectionUpdateSheet({
  _id,
  ...props
}: React.ComponentProps<typeof SheetTrigger> & {
  _id: string;
}) {
  const { t } = useI18n();
  const management = useCollectionManagement();

  const [open, setOpen] = React.useState(false);

  const field = useQuery({
    queryKey: [
      "/collections/".concat(management.slug).concat("/fields/").concat(_id),
      _id,
    ],
    queryFn: async function () {
      const route = "/collections/"
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
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_UPDATE_TITLE",
              "Atualizar Campo"
            )}
          </SheetTitle>

          <SheetDescription>
            {t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_UPDATE_DESCRIPTION",
              "Atualize os detalhes do campo"
            )}
          </SheetDescription>
        </SheetHeader>

        {field.status === "success" && (
          <FieldCollectionUpdateForm
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
