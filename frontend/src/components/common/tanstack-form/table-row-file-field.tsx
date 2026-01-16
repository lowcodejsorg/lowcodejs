import { FileUploadWithStorage } from '@/components/common/file-upload-with-storage';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
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

export function TableRowFileField({
  field,
  disabled,
}: TableRowFileFieldProps): React.JSX.Element {
  const formField = useFieldContext<FileValue>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  const value = formField.state.value;

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
        maxFiles={field.configuration.multiple ? 10 : 1}
        className={cn(disabled && 'pointer-events-none opacity-50')}
      />
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
