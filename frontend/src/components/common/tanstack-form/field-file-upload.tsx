import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import { FileUploadWithStorage } from '@/components/common/file-upload-with-storage';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import type { IStorage } from '@/lib/interfaces';

interface FieldFileUploadProps {
  label: string;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  placeholder?: string;
  shouldDeleteFromStorage?: boolean;
  onStorageChange?: (storages: Array<IStorage>) => void;
  showPreview?: boolean;
  previewUrl?: string;
  previewAlt?: string;
}

export function FieldFileUpload({
  label,
  accept,
  maxFiles = 1,
  maxSize = 4 * 1024 * 1024,
  placeholder,
  shouldDeleteFromStorage,
  onStorageChange,
  showPreview,
  previewUrl,
  previewAlt,
}: FieldFileUploadProps): React.JSX.Element {
  const field = useFieldContext<Array<File>>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

      {!showPreview && (
        <FileUploadWithStorage
          value={field.state.value}
          onValueChange={field.handleChange}
          onStorageChange={onStorageChange || ((): void => {})}
          accept={accept}
          maxFiles={maxFiles}
          maxSize={maxSize}
          placeholder={placeholder}
          shouldDeleteFromStorage={shouldDeleteFromStorage}
        />
      )}

      {showPreview && previewUrl && (
        <div className="mt-2 p-2 border rounded-md">
          <img
            src={previewUrl}
            alt={previewAlt || 'Preview'}
            className="w-full h-32 object-contain"
          />
        </div>
      )}

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
