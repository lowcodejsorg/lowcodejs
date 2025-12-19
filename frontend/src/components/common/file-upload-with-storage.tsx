import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Upload, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import type { FileUploadProps } from '@/components/common/file-upload';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadTrigger,
} from '@/components/common/file-upload';
import { Button } from '@/components/ui/button';
import { API } from '@/lib/api';
import type { IStorage } from '@/lib/interfaces';

interface FileUploadWithStorageProps {
  value: Array<File>;
  onValueChange: (files: Array<File>) => void;
  onStorageChange: (storages: Array<IStorage>) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  placeholder?: string;
  defaultValue?: Array<File>;
  shouldDeleteFromStorage?: boolean;
}

export function FileUploadWithStorage({
  value,
  onValueChange,
  onStorageChange,
  accept,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024,
  className,
  placeholder = 'Arraste e solte ou escolha o arquivo',
  defaultValue,
  shouldDeleteFromStorage = true,
}: FileUploadWithStorageProps): React.JSX.Element {
  const [storageFiles, setStorageFiles] = React.useState<Map<File, IStorage>>(
    new Map(),
  );

  const upload = useMutation({
    mutationFn: async function (files: Array<File>) {
      const formData = new FormData();

      for (const file of files) {
        formData.append('files', file);
      }

      const route = '/storage';
      const response = await API.post<Array<IStorage>>(route, formData);
      return response.data;
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        if (data?.code === 500 && data?.cause === 'STORAGE_UPLOAD_ERROR') {
          toast.error(data?.message ?? 'Erro interno do servidor');
        }
      }

      console.error(error);
    },
    onSuccess(response, uploadedFiles) {
      setStorageFiles((prevStorageFiles) => {
        const newStorageFiles = new Map(prevStorageFiles);

        for (const [index, file] of uploadedFiles.entries()) {
          if (response[index]) {
            newStorageFiles.set(file, response[index]);
          }
        }

        return newStorageFiles;
      });

      // Retornar objetos IStorage completos
      onStorageChange(response);
    },
  });

  const remove = useMutation({
    mutationFn: async function ({ storage }: { storage: IStorage }) {
      if (shouldDeleteFromStorage) {
        const route = '/storage/'.concat(storage._id);
        await API.delete(route);
      }
      return storage;
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        if (data?.code === 404 && data?.cause === 'STORAGE_NOT_FOUND') {
          toast.error(data?.message ?? 'Arquivo não encontrado');
        }

        if (data?.code === 500 && data?.cause === 'STORAGE_DELETE_ERROR') {
          toast.error(data?.message ?? 'Erro interno do servidor');
        }
      }

      console.error(error);
    },
    onSuccess(deletedStorage) {
      // Encontrar o arquivo associado ao storage
      let fileToRemove: File | null = null;

      for (const [file, storage] of storageFiles.entries()) {
        if (storage._id === deletedStorage._id) {
          fileToRemove = file;
          break;
        }
      }

      if (fileToRemove) {
        setStorageFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileToRemove as File);
          return newMap;
        });

        const updatedFiles = value.filter((f) => f !== fileToRemove);
        onValueChange(updatedFiles);
      }

      // Atualizar lista de storages retornando objetos completos
      const remainingStorages = Array.from(storageFiles.values()).filter(
        (storage) => storage._id !== deletedStorage._id,
      );
      onStorageChange(remainingStorages);
    },
  });

  const onUpload: NonNullable<FileUploadProps['onUpload']> = React.useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      try {
        const uploadPromises = files.map(async (file) => {
          try {
            const totalChunks = 10;
            let uploadedChunks = 0;

            for (let i = 0; i < totalChunks; i++) {
              await new Promise((resolve) =>
                setTimeout(resolve, Math.random() * 200 + 100),
              );

              uploadedChunks++;
              const progress = (uploadedChunks / totalChunks) * 100;
              onProgress(file, progress);
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
            onSuccess(file);
          } catch (error) {
            onError(
              file,
              error instanceof Error ? error : new Error('Upload failed'),
            );
          }
        });

        await Promise.all(uploadPromises);
        await upload.mutateAsync(files);
      } catch (error) {
        console.error('Unexpected error during upload:', error);
      }
    },
    [upload],
  );

  const onFileReject = React.useCallback((file: File, message: string) => {
    let errorMessage = message;

    if (message === 'File too large') {
      errorMessage = 'Arquivo muito grande';
    } else if (message === 'File type not accepted') {
      errorMessage = 'Tipo de arquivo não aceito';
    } else if (message.startsWith('Maximum')) {
      errorMessage = 'Número máximo de arquivos excedido';
    }

    toast.error(errorMessage, {
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" foi rejeitado`,
    });
  }, []);

  const handleRemoveFile = React.useCallback(
    (file: File) => {
      const storage = storageFiles.get(file);

      if (storage) {
        remove.mutateAsync({ storage });
      } else {
        // Se não tem storage ainda (upload não completou), apenas remove local
        const updatedFiles = value.filter((f) => f !== file);
        onValueChange(updatedFiles);
      }
    },
    [storageFiles, value, onValueChange, remove],
  );

  return (
    <FileUpload
      value={value}
      onValueChange={onValueChange}
      onUpload={onUpload}
      onFileReject={onFileReject}
      accept={accept}
      maxFiles={maxFiles}
      maxSize={maxSize}
      className={className}
      multiple={maxFiles > 1}
      defaultValue={defaultValue}
    >
      <FileUploadDropzone className="flex-row flex-wrap border-dotted text-center">
        <Upload className="size-4" />
        {placeholder}
        <FileUploadTrigger
          asChild
          disabled={upload.status === 'pending' || remove.status === 'pending'}
        >
          <Button
            variant="link"
            size="sm"
            className="p-0"
          >
            escolha o arquivo
          </Button>
        </FileUploadTrigger>
      </FileUploadDropzone>
      <FileUploadList>
        {value.map((file, index) => (
          <FileUploadItem
            key={index}
            value={file}
            className="flex-col"
          >
            <div className="flex w-full items-center gap-2">
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => handleRemoveFile(file)}
                >
                  <X />
                </Button>
              </FileUploadItemDelete>
            </div>
            {!('isUploaded' in file) && <FileUploadItemProgress />}
          </FileUploadItem>
        ))}
      </FileUploadList>
    </FileUpload>
  );
}
