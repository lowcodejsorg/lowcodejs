import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import {
  FIELD_TYPE,
  type Collection,
  type Field,
  type Row,
} from "@/lib/entity";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { TrashIcon } from "lucide-react";
import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { RowCollectionDate } from "./row-collection-date";
import { RowCollectionDropdown } from "./row-collection-dropdown";
import { RowCollectionFile } from "./row-collection-file";
// import { CollectionRelationshipRow } from "./collection-relationship.collection-row";
import { RowCollectionTextLong } from "./row-collection-text-long";
import { RowCollectionTextShort } from "./row-collection-text-short";

interface Props {
  field: Field;
  defaultValue?: Field[];
  required?: boolean;
}

export function RowCollectionFieldGroup({
  field: fieldProp,
  defaultValue = [],
  required = false,
}: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  const collection = useQuery({
    queryKey: ["/collections/".concat(fieldProp.slug), fieldProp.slug],
    queryFn: async () => {
      const route = "/collections/".concat(fieldProp.slug);
      const response = await API.get<Collection>(route);
      return response.data;
    },
    enabled: Boolean(fieldProp.slug),
  });

  const _delete = useMutation({
    mutationFn: async ({ _id, slug }: { _id: string; slug: string }) => {
      const route = "/collections/".concat(slug).concat("/rows/").concat(_id);

      const response = await API.delete(route);
      return response.data;
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(data?.message ?? "ID do registro inválido");
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

        // 409 - ROW_IN_USE
        if (data?.code === 409 && data?.cause === "ROW_IN_USE") {
          toast.error(
            data?.message ??
              "Não é possível deletar: registro está sendo referenciado"
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  const { append, fields, replace, remove } = useFieldArray({
    control: form.control,
    name: fieldProp.slug,
  });

  function added() {
    append(
      collection?.data?.fields?.reduce(
        (acc, c) => ({ ...acc, [c.slug]: undefined }),
        {}
      )
    );
  }

  React.useEffect(() => {
    if (defaultValue && defaultValue.length > 0) {
      replace(defaultValue);
    }
  }, [defaultValue, replace]);

  function renderField(f: Field, itemIndex: number) {
    const fieldName = `${fieldProp.slug}.${itemIndex}.${f.slug}`;
    const currentValue = form.getValues(fieldName);

    if (f.type === FIELD_TYPE.TEXT_SHORT) {
      return (
        <RowCollectionTextShort
          required={f?.configuration?.required}
          field={f}
          defaultValue={currentValue}
          name={fieldName}
        />
      );
    }

    if (f.type === FIELD_TYPE.TEXT_LONG) {
      return (
        <RowCollectionTextLong
          required={f?.configuration?.required}
          field={f}
          defaultValue={currentValue}
          name={fieldName}
        />
      );
    }

    if (f.type === FIELD_TYPE.DROPDOWN) {
      const defaultValue =
        Array.from<string>(currentValue ?? [])?.map((item) => ({
          label: item,
          value: item,
        })) ?? [];

      return (
        <RowCollectionDropdown
          required={f?.configuration?.required}
          field={f}
          isMultiple={f?.configuration?.multiple}
          defaultValue={defaultValue}
          name={fieldName}
        />
      );
    }

    if (f.type === FIELD_TYPE.FILE) {
      const MAX_SIZE = 10 * 1024 * 1024;
      return (
        <RowCollectionFile
          key={f._id}
          dropzoneOptions={{
            multiple: f?.configuration?.multiple,
            maxFiles: 10,
            maxSize: MAX_SIZE,
            accept: {
              "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
              "application/*": [".pdf", ".doc", ".docx", ".xls", ".xlsx"],
              "text/*": [".csv", ".txt"],
            },
          }}
          field={f}
          required={f?.configuration?.required}
          defaultValue={currentValue}
          name={fieldName}
        />
      );
    }

    if (f.type === FIELD_TYPE.DATE) {
      const dateValue = currentValue ? new Date(currentValue) : undefined;

      return (
        <RowCollectionDate
          key={f._id}
          field={f}
          required={f?.configuration?.required}
          defaultValue={dateValue}
          name={fieldName}
        />
      );
    }

    return null;
  }

  function removeItem(index: number) {
    const registro = fields[index] as unknown as Row;

    if (registro?._id) {
      _delete.mutateAsync({
        _id: registro._id,
        slug: fieldProp?.configuration?.group!.slug,
      });
    }

    remove(index);
  }

  return (
    <FormField
      key={fieldProp._id}
      control={form.control}
      name={fieldProp.slug}
      // defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!required) return true;

          // Verifica se tem pelo menos um registro
          if (!value || !Array.isArray(value) || value.length === 0) {
            return t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_AT_LEAST_ONE_OPTION_ERROR",
              "Adicione ao menos uma opção"
            );
          }

          // Verifica se pelo menos um registro tem pelo menos um campo preenchido
          const hasValidRecord = value.some((record) => {
            return Object.values(record || {}).some((fieldValue) => {
              return (
                fieldValue !== null &&
                fieldValue !== undefined &&
                fieldValue !== ""
              );
            });
          });

          if (!hasValidRecord) {
            return t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_AT_LEAST_ONE_OPTION_ERROR",
              "Preencha pelo menos um campo em um dos registros"
            );
          }

          return true;
        },
      }}
      render={({ field: f }) => {
        const hasError = !!form.formState.errors[f.name];

        return (
          <FormItem>
            <div className="inline-flex justify-between items-center">
              <FormLabel className="data-[error=true]:text-destructive">
                {fieldProp.name}{" "}
                {required && <span className="text-destructive">*</span>}
              </FormLabel>
              {collection?.status === "success" &&
                collection?.data?.fields?.length > 0 && (
                  <Button
                    type="button"
                    onClick={added}
                    className="shadow-none py-1 px-2 h-auto"
                  >
                    {t(
                      "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_ADD_BUTTON_LABEL",
                      "added"
                    )}
                  </Button>
                )}
            </div>
            <FormControl>
              <div className="border rounded-lg overflow-hidden">
                {fields.map((item, index) => (
                  <div
                    key={item.id ?? (item as unknown as Row)?._id}
                    className={cn(
                      "border-t grid grid-cols-2 gap-4 p-3 hover:bg-muted/20 transition-colors relative",
                      hasError && "border-destructive/20 bg-destructive/5"
                    )}
                  >
                    {collection?.data?.fields
                      ?.filter((c) => !c?.trashed)
                      ?.map((c) => (
                        <div key={c._id} className="min-w-0 ">
                          {renderField(c, index)}
                        </div>
                      ))}
                    <div className="flex justify-center absolute right-1 top-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </div>
                  </div>
                ))}

                {collection?.status === "success" &&
                  collection?.data?.fields?.length === 0 && (
                    <div
                      className={cn(
                        "p-8 flex flex-col items-center justify-center text-center border-dashed border-2",
                        hasError
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-muted-foreground/25"
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm mb-2",
                          hasError
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        O grupo não possui nenhum campo cadastrado
                      </p>
                    </div>
                  )}

                {collection?.status === "success" &&
                  collection?.data?.fields?.length > 0 &&
                  fields.length === 0 && (
                    <div
                      className={cn(
                        "p-8 flex flex-col items-center justify-center text-center border-dashed border-2",
                        hasError
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-muted-foreground/25"
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm mb-2",
                          hasError
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        {t(
                          "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_NO_FIELDS_ADDED_MESSAGE",
                          "Nenhum field adicionado. Clique no botão acima para adicionar"
                        )}
                      </p>
                    </div>
                  )}
              </div>
            </FormControl>
            {/* <FormMessage className="text-right text-destructive" /> */}
          </FormItem>
        );
      }}
    />
  );
}
