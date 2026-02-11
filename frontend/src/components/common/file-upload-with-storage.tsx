import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Paperclip, Upload, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface FileUploadWithStorageProps {
  value: Array<File>;
  onValueChange: (files: Array<File>) => void;
  onStorageChange: (storages: Array<IStorage>) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  placeholder?: string;
  defaultValue?: Array<File>;
  shouldDeleteFromStorage?: boolean;
  compact?: boolean;
  showHint?: boolean;
}

export function FileUploadWithStorage({
  value,
  onValueChange,
  onStorageChange,
  onUploadingChange,
  accept,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024,
  className,
  placeholder = 'Arraste e solte ou escolha o arquivo',
  defaultValue,
  shouldDeleteFromStorage = true,
  compact = false,
  showHint = true,
}: FileUploadWithStorageProps): React.JSX.Element {
  const [storageFiles, setStorageFiles] = React.useState<Map<File, IStorage>>(
    new Map(),
  );
  const [isProcessing, setIsProcessing] = React.useState(false);

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
          toast('Erro ao fazer upload', {
            className:
              '!bg-destructive !text-primary-foreground !border-destructive',
            description:
              'Houve um problema ao tentar fazer upload, tente novamente mais tarde.',
            descriptionClassName: '!text-primary-foreground',
            closeButton: true,
          });
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
        const route = '/storage/'.concat(storage.id);
        await API.delete(route);
      }
      return storage;
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        if (data?.code === 404 && data?.cause === 'STORAGE_NOT_FOUND') {
          toast(data?.message ?? 'Arquivo não encontrado', {
            className:
              '!bg-destructive !text-primary-foreground !border-destructive',
            descriptionClassName: '!text-primary-foreground',
            closeButton: true,
          });
        }

        if (data?.code === 500 && data?.cause === 'STORAGE_DELETE_ERROR') {
          toast(data?.message ?? 'Erro interno do servidor', {
            className:
              '!bg-destructive !text-primary-foreground !border-destructive',
            descriptionClassName: '!text-primary-foreground',
            closeButton: true,
          });
        }
      }

      console.error(error);
    },
    onSuccess(deletedStorage) {
      // Encontrar o arquivo associado ao storage
      let fileToRemove: File | null = null;

      for (const [file, storage] of storageFiles.entries()) {
        if (storage.id === deletedStorage.id) {
          fileToRemove = file;
          break;
        }
      }

      if (fileToRemove) {
        setStorageFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileToRemove);
          return newMap;
        });

        const updatedFiles = value.filter((f) => f !== fileToRemove);
        onValueChange(updatedFiles);
      }

      // Atualizar lista de storages retornando objetos completos
      const remainingStorages = Array.from(storageFiles.values()).filter(
        (storage) => storage.id !== deletedStorage.id,
      );
      onStorageChange(remainingStorages);
    },
  });

  const isPending =
    isProcessing || upload.status === 'pending' || remove.status === 'pending';

  React.useEffect(() => {
    onUploadingChange?.(isPending);
  }, [isPending, onUploadingChange]);

  const onUpload: NonNullable<FileUploadProps['onUpload']> = React.useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      setIsProcessing(true);
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
      } finally {
        setIsProcessing(false);
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

    toast(errorMessage, {
      className: '!bg-destructive !text-primary-foreground !border-destructive',
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" foi rejeitado`,
      descriptionClassName: '!text-primary-foreground',
      closeButton: true,
    });
  }, []);

  const handleRemoveFile = React.useCallback(
    (file: File) => {
      const storage = storageFiles.get(file);
      if (storage) {
        remove.mutateAsync({ storage });
      }

      if (!storage) {
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
      <FileUploadDropzone
        className={cn(
          'flex-row flex-wrap border-dotted text-center',
          compact ? 'gap-1 py-2 text-xs' : 'gap-2',
        )}
      >
        <Upload className={compact ? 'size-3' : 'size-4'} />
        {!compact && placeholder}
        <FileUploadTrigger
          asChild
          disabled={isPending}
        >
          <Button
            variant="link"
            size={compact ? 'icon-sm' : 'sm'}
            className={cn('p-0 cursor-pointer', compact && 'h-6 w-6')}
            aria-label="Anexar arquivo"
          >
            {compact ? <Paperclip className="size-3.5" /> : 'escolha o arquivo'}
          </Button>
        </FileUploadTrigger>
        {showHint && !compact && (
          <span className="w-full text-xs text-muted-foreground">
            Tamanho máximo: {Math.round(maxSize / (1024 * 1024))}MB
          </span>
        )}
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
