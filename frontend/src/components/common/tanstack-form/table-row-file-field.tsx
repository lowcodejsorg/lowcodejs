import * as React from 'react';

import { FileUploadWithStorage } from '@/components/common/file-upload-with-storage';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField, IStorage } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableRowFileFieldProps {
  field: IField;
  disabled?: boolean;
}

type FileValue = {
  files: Array<File>;
  storages: Array<IStorage>;
};

type FileWithUploaded = File & { isUploaded?: boolean };

async function storageToFile(storage: IStorage): Promise<FileWithUploaded> {
  const response = await fetch(storage.url);
  const blob = await response.blob();
  const file: FileWithUploaded = new File([blob], storage.originalName, {
    type: storage.mimetype,
  });
  file.isUploaded = true;
  return file;
}

export function TableRowFileField({
  field,
  disabled,
}: TableRowFileFieldProps): React.JSX.Element {
  const formField = useFieldContext<FileValue>();
  const isInvalid =
    formField.state.meta.isDirty && !formField.state.meta.isValid;
  const errorId = `${formField.name}-error`;
  const isRequired = field.required;

  const rawValue = formField.state.value;
  const value: FileValue =
    rawValue &&
    typeof rawValue === 'object' &&
    'files' in rawValue &&
    'storages' in rawValue
      ? rawValue
      : { files: [], storages: [] };

  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false);
  const [initialStorages] = React.useState<Array<IStorage>>(
    () => value.storages,
  );

  React.useEffect(() => {
    async function loadStorageFiles(): Promise<void> {
      if (initialStorages.length === 0) return;
      if (value.files.length > 0) return;

      setIsLoadingFiles(true);

      try {
        const files = await Promise.all(initialStorages.map(storageToFile));

        formField.handleChange({
          files,
          storages: initialStorages,
        });
      } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
      } finally {
        setIsLoadingFiles(false);
      }
    }

    loadStorageFiles();
  }, []);

  if (isLoadingFiles) {
    return (
      <Field>
        <FieldLabel htmlFor={formField.name}>
          {field.name}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <div className="flex items-center gap-2 p-4 border rounded-md">
          <Spinner />
          <span className="text-sm text-muted-foreground">
            Carregando arquivos...
          </span>
        </div>
      </Field>
    );
  }

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <FileUploadWithStorage
        value={value.files}
        onValueChange={(files) => formField.handleChange({ ...value, files })}
        onStorageChange={(storages) =>
          formField.handleChange({ ...value, storages })
        }
        initialStorages={initialStorages}
        maxFiles={field.multiple ? 10 : 1}
        className={cn(disabled && 'pointer-events-none opacity-50')}
      />
      {isInvalid && (
        <FieldError
          id={errorId}
          errors={formField.state.meta.errors}
        />
      )}
    </Field>
  );
}
