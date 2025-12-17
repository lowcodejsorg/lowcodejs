import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { API } from "@/lib/api";
import type { Storage } from "@/lib/entity";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn, storageToFile } from "@/lib/utils";
import { CloudUploadIcon, LoaderCircleIcon, TrashIcon } from "lucide-react";
import React from "react";
import { type DropzoneOptions } from "react-dropzone";
import { useFormContext } from "react-hook-form";
import { FileInput, FileUploader, FileUploaderContent } from "./file-uploader";

interface Props {
  defaultValue?: Storage[];
  fieldName: string;
  label: string;
  dropzoneOptions: DropzoneOptions;
  placeholder?: string;
}

export function Uploader({
  defaultValue,
  fieldName,
  label,
  dropzoneOptions,
  placeholder = "Arraste ou selecione um arquivo",
}: Props): React.JSX.Element {
  const [files, setFiles] = React.useState<Storage[]>([
    ...(defaultValue || []),
  ]);

  const form = useFormContext();

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
          toast.error(data?.message ?? "Dados inválidos");
        }

        // 400 - INVALID_FILE_TYPE
        if (data?.code === 400 && data?.cause === "INVALID_FILE_TYPE") {
          toast.error(data?.message ?? "Tipo de arquivo não permitido");
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
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
            data?.message ?? "Arquivo falhou na verificação de vírus"
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
      const isMultiple =
        dropzoneOptions.multiple !== false && dropzoneOptions.maxFiles !== 1;

      if (isMultiple) {
        setFiles((prevFiles) => {
          const newFiles = [...prevFiles, ...response];
          form.setValue(
            fieldName,
            newFiles.flatMap((f) => f._id)
          );
          return newFiles;
        });
      } else {
        setFiles([response[0]]);
        form.setValue(fieldName, response[0]._id!);
      }
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
          toast.error(data?.message ?? "ID do arquivo inválido");
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ?? "Acesso negado para deletar este arquivo"
          );
        }

        // 404 - FILE_NOT_FOUND
        if (data?.code === 404 && data?.cause === "FILE_NOT_FOUND") {
          toast.error(data?.message ?? "Arquivo não encontrado");
        }

        // 409 - FILE_IN_USE
        if (data?.code === 409 && data?.cause === "FILE_IN_USE") {
          toast.error(
            data?.message ?? "Não é possível deletar: arquivo está em uso"
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
      const isMultiple =
        dropzoneOptions.multiple !== false && dropzoneOptions.maxFiles !== 1;

      setFiles((prevFiles) => {
        const updatedFiles = prevFiles.filter((file) => file._id !== _id);

        if (isMultiple) {
          form.setValue(
            fieldName,
            updatedFiles.flatMap((f) => f._id)
          );
        } else {
          form.setValue(fieldName, null);
        }

        // Limpar campo files para permitir novo upload quando lista ficar vazia
        if (updatedFiles.length === 0) {
          form.setValue(`${fieldName}_files`, []);
        }

        return updatedFiles;
      });
    },
  });

  function removeFile(_id: string) {
    remove.mutateAsync({ _id });
  }

  const defaultFile = React.useMemo(() => {
    if (defaultValue?.length === 0) return null;
    return defaultValue?.map(storageToFile);
  }, [defaultValue]);

  return (
    <FormField
      control={form.control}
      name={`${fieldName}_files`}
      defaultValue={defaultFile}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              {label}
            </FormLabel>
            <FileUploader
              value={field.value}
              onValueChange={(value) => {
                if (value && value.length > 0) {
                  const formData = new FormData();
                  const isMultiple =
                    dropzoneOptions.multiple !== false &&
                    dropzoneOptions.maxFiles !== 1;

                  if (isMultiple) {
                    for (const file of value) {
                      formData.append("files[]", file);
                    }
                  } else {
                    formData.append("files[0]", value[0]);
                  }

                  upload.mutateAsync(formData);
                }

                field.onChange(value);
              }}
              dropzoneOptions={dropzoneOptions}
              reSelect={true}
              className={cn("relative rounded-lg border border-dashed")}
            >
              <FileInput>
                <div
                  className={cn(
                    "inline-flex items-center justify-center w-full gap-4 py-2"
                  )}
                >
                  {upload.status === "pending" && (
                    <LoaderCircleIcon className="w-4 h-4 animate-spin" />
                  )}

                  {!(upload.status === "pending") && (
                    <p className="text-sm text-muted-foreground inline-flex space-x-2">
                      <CloudUploadIcon className="w-4 h-4 " />
                      <span>{placeholder}</span>
                    </p>
                  )}
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
                        {file.filename}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => {
                          removeFile(file._id);
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </FileUploaderContent>
              )}
            </FileUploader>
          </FormItem>
        );
      }}
    />
  );
}
