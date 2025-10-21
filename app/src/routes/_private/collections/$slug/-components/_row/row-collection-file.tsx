import {
  FileInput,
  FileUploader,
  FileUploaderContent,
} from "@/components/custom/uploader/file-uploader";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Field, Storage } from "@/lib/entity";

import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { CloudUploadIcon, LoaderCircleIcon, TrashIcon } from "lucide-react";
import React from "react";
import { type DropzoneOptions } from "react-dropzone";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  defaultValue?: Storage[];
  dropzoneOptions: DropzoneOptions;
  field: Field;
  required?: boolean;
  name?: string;
}

export function RowCollectionFile({
  defaultValue,
  field: fieldProp,
  required,
  dropzoneOptions,
  name,
}: Props): React.JSX.Element {
  const { t } = useI18n();
  const [files, setFiles] = React.useState<Storage[]>([
    ...(defaultValue || []),
  ]);

  const form = useFormContext();

  // Initialize form field with existing file IDs if not already set
  React.useEffect(() => {
    const fieldName = name ?? fieldProp.slug;
    const currentValue = form.getValues(fieldName);

    if (
      defaultValue &&
      defaultValue.length > 0 &&
      (!currentValue || currentValue.length === 0)
    ) {
      form.setValue(
        fieldName,
        defaultValue.map((file) => file._id)
      );
    }
  }, [defaultValue, form, name, fieldProp.slug]);

  const upload = useMutation({
    mutationFn: async function (payload: FormData) {
      const route = "/storage";
      const response = await API.post<Storage[]>(route, payload);
      return response.data;
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ??
              t("COLLECTION_FILE_ERROR_INVALID_DATA", "Invalid data")
          );
        }

        // 400 - INVALID_FILE_TYPE
        if (data?.code === 400 && data?.cause === "INVALID_FILE_TYPE") {
          toast.error(
            data?.message ??
              t(
                "COLLECTION_FILE_ERROR_TYPE_NOT_ALLOWED",
                "File type not allowed"
              )
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
          toast.error(data?.message ?? "Acesso negado para upload de arquivos");
        }

        // 413 - FILE_TOO_LARGE
        if (data?.code === 413 && data?.cause === "FILE_TOO_LARGE") {
          toast.error(data?.message ?? "Arquivo muito grande");
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(
            data?.message ??
              t(
                "COLLECTION_FILE_ERROR_VIRUS_CHECK_FAILED",
                "File failed virus check"
              )
          );
        }

        // 429 - RATE_LIMIT_EXCEEDED
        if (data?.code === 429 && data?.cause === "RATE_LIMIT_EXCEEDED") {
          toast.error(data?.message ?? "Limite de upload excedido");
        }

        // 507 - INSUFFICIENT_STORAGE
        if (data?.code === 507 && data?.cause === "INSUFFICIENT_STORAGE") {
          toast.error(data?.message ?? "Cota de armazenamento excedida");
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
    onSuccess(response) {
      setFiles((state) => {
        const newFiles = [...state, ...response];
        form.setValue(
          name ?? fieldProp.slug,
          newFiles.map((file) => file._id)
        );
        return newFiles;
      });
    },
  });

  const remove = useMutation({
    mutationFn: async function ({ _id }: { _id: string }) {
      const route = "/storage/".concat(_id);
      const response = await API.delete<Storage>(route);
      return response.data;
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ??
              t("COLLECTION_FILE_ERROR_INVALID_ID", "Invalid file ID")
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
            data?.message ?? "Acesso negado para deletar este arquivo"
          );
        }

        // 404 - FILE_NOT_FOUND
        if (data?.code === 404 && data?.cause === "FILE_NOT_FOUND") {
          toast.error(
            data?.message ??
              t("COLLECTION_FILE_ERROR_NOT_FOUND", "File not found")
          );
        }

        // 409 - FILE_IN_USE
        if (data?.code === 409 && data?.cause === "FILE_IN_USE") {
          toast.error(
            data?.message ??
              t(
                "COLLECTION_FILE_ERROR_CANNOT_DELETE_IN_USE",
                "Cannot delete: file is in use"
              )
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
    onSuccess(_, { _id }) {
      setFiles((prevFiles) => {
        const updatedFiles = prevFiles.filter((file) => file._id !== _id);
        form.setValue(
          name ?? fieldProp.slug,
          updatedFiles.map((file) => file._id)
        );
        // Limpar campo files para permitir novo upload quando lista ficar vazia
        if (updatedFiles.length === 0) {
          form.setValue("files", []);
        }
        return updatedFiles;
      });
    },
  });

  return (
    <React.Fragment>
      <FormField
        control={form.control}
        name={name ?? fieldProp.slug}
        rules={{
          validate: () => {
            if (
              (files.length === 0 ||
                !form.getValues(name ?? fieldProp.slug) ||
                form.getValues(name ?? fieldProp.slug).length === 0) &&
              required
            )
              return fieldProp.name
                .concat(" ")
                .concat(
                  t("COLLECTION_FIELD_REQUIRED_SUFFIX", "is required") as string
                );

            return true;
          },
        }}
        render={({ field: f }) => {
          const hasError = !!form.formState.errors[f.name];

          return (
            <FormItem>
              <div className="flex flex-col">
                <FormLabel className="data-[error=true]:text-destructive">
                  {fieldProp.name}{" "}
                  {required && <span className="text-destructive">*</span>}
                </FormLabel>
                <p>
                  <span className="text-muted-foreground text-xs">
                    {t(
                      "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_FILE_SIZE_LIMIT",
                      "Submeta arquivos de até 10 MB."
                    )}
                  </span>
                </p>
              </div>
              <FileUploader
                orientation="horizontal"
                value={f.value}
                onValueChange={(value) => {
                  if (value && value.length > 0) {
                    // Filter out duplicate files
                    const newFiles = value.filter((file) => {
                      const isDuplicate = files.some(
                        (existingFile) =>
                          existingFile.originalName === file.name &&
                          existingFile.size === file.size
                      );

                      if (isDuplicate) {
                        // toast.error("Este arquivo já foi submetido");
                        form.setError(fieldProp.slug, {
                          message: "Voce não pode submeter arquivos duplicados",
                        });
                      }

                      return !isDuplicate;
                    });

                    if (newFiles.length > 0) {
                      const formData = new FormData();
                      for (const file of newFiles) {
                        formData.append("files[]", file);
                      }
                      upload.mutateAsync(formData);
                    }
                  }
                }}
                dropzoneOptions={dropzoneOptions}
                reSelect={true}
                className={cn(
                  "relative rounded-lg border border-dashed",
                  hasError && "border-destructive"
                )}
              >
                <FileInput>
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-full gap-4 py-2"
                    )}
                  >
                    {!(upload.status === "pending") && (
                      <CloudUploadIcon className="w-4 h-4 " />
                    )}
                    {upload.status === "pending" && (
                      <LoaderCircleIcon className="w-4 h-4 animate-spin" />
                    )}

                    <p className="text-sm">
                      {!(upload.status === "pending") && (
                        <span>
                          <strong>
                            {t(
                              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_UPLOAD_FILE_INSTRUCTIONS",
                              "Clique para fazer upload"
                            )}
                          </strong>{" "}
                          {t(
                            "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_UPLOAD_FILE_INSTRUCTIONS",
                            "ou arraste e solte."
                          )}
                        </span>
                      )}
                      {upload.status === "pending" && (
                        <span>
                          <strong>
                            {t(
                              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_UPLOAD_FILE_WAITING",
                              "Aguarde"
                            )}
                          </strong>{" "}
                          {t(
                            "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_UPLOAD_FILE_WAITING",
                            "enviando o arquivo."
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </FileInput>

                {files?.length > 0 && (
                  <FileUploaderContent className="p-2 flex flex-col gap-2">
                    {files.map((file) => (
                      <div
                        key={file._id}
                        className="flex items-center justify-between p-2 border rounded-md bg-muted"
                      >
                        <span
                          className="text-sm font-medium truncate cursor-pointer hover:text-blue-600"
                          onClick={() =>
                            file.url && window.open(file.url, "_blank")
                          }
                        >
                          {file.originalName}
                          {/* ({file.filename}) */}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => {
                            form.clearErrors(fieldProp.slug);
                            remove.mutate({ _id: file._id });
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </FileUploaderContent>
                )}
              </FileUploader>
              <p>
                <span className="text-muted-foreground text-xs font-semibold">
                  {t(
                    "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_SUPPORTED_FILES_LABEL",
                    "Arquivos suportados:"
                  )}{" "}
                  {Object.values(dropzoneOptions?.accept || {})
                    .flatMap((arr) => arr)
                    .join(", ")}
                </span>
              </p>
              <FormMessage className="text-right text-destructive" />
            </FormItem>
          );
        }}
      />
    </React.Fragment>
  );
}
