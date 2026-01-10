import { EditorExample } from '@/components/common/editor';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableRowRichTextFieldProps {
  field: IField;
  disabled?: boolean;
}

export function TableRowRichTextField({
  field,
  disabled,
}: TableRowRichTextFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  // Se disabled, mostrar apenas preview
  if (disabled) {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <div className="border rounded-md p-4 bg-muted min-h-25">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: formField.state.value || '<p>Sem conteúdo</p>',
            }}
          />
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
      <div
        className={cn(
          'border rounded-md overflow-hidden',
          isInvalid && 'border-destructive',
        )}
      >
        <EditorExample
          value={formField.state.value || ''}
          onChange={(value) => formField.handleChange(value)}
        />
      </div>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
