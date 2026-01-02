import { useFieldContext } from '../form-context';

import { EditorExample } from '@/components/common/editor';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

interface EditorFieldProps {
  label: string;
  showPreview?: boolean;
}

export function EditorField({
  label,
  showPreview,
}: EditorFieldProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {!showPreview && (
        <div
          className={cn(
            'border rounded-md overflow-hidden',
            isInvalid && 'border-destructive',
          )}
        >
          <EditorExample
            value={field.state.value || ''}
            onChange={(value) => field.handleChange(value)}
          />
        </div>
      )}
      {showPreview && (
        <div className="border rounded-md p-4 bg-muted min-h-25">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: field.state.value || '<p>Sem conteúdo</p>',
            }}
          />
        </div>
      )}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
