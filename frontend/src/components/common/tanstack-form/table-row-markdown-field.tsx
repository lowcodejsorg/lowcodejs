import { EyeIcon, PencilIcon } from 'lucide-react';
import { Suspense, lazy, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

const ContentViewer = lazy(() =>
  import('@/components/common/editor').then((m) => ({
    default: m.ContentViewer,
  })),
);

interface TableRowMarkdownFieldProps {
  field: IField;
  disabled?: boolean;
  compact?: boolean;
}

export function TableRowMarkdownField({
  field,
  disabled,
  compact = false,
}: TableRowMarkdownFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const errorId = `${formField.name}-error`;
  const isRequired = field.required;
  const [preview, setPreview] = useState(false);

  if (disabled) {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <div className="border rounded-md p-4 bg-muted min-h-25">
          <Suspense fallback={<Skeleton className="h-20 w-full" />}>
            <ContentViewer content={formField.state.value || ''} />
          </Suspense>
        </div>
      </Field>
    );
  }

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor={formField.name}>
          {field.name}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setPreview((v) => !v)}
          className="cursor-pointer"
          aria-label={preview ? 'Editar' : 'Pré-visualizar'}
        >
          {preview ? (
            <PencilIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </Button>
      </div>
      {preview ? (
        <div
          className={cn(
            'border rounded-md p-4 min-h-25',
            isInvalid && 'border-destructive',
          )}
        >
          <Suspense fallback={<Skeleton className="h-20 w-full" />}>
            <ContentViewer content={formField.state.value || ''} />
          </Suspense>
        </div>
      ) : (
        <Textarea
          id={formField.name}
          name={formField.name}
          placeholder="Escreva em markdown..."
          value={formField.state.value || ''}
          onBlur={formField.handleBlur}
          onChange={(e) => formField.handleChange(e.target.value)}
          rows={compact ? 3 : 6}
          className={cn('font-mono text-sm', isInvalid && 'border-destructive')}
          aria-invalid={isInvalid}
          aria-required={isRequired}
          aria-describedby={isInvalid ? errorId : undefined}
        />
      )}
      {isInvalid && (
        <FieldError
          id={errorId}
          errors={formField.state.meta.errors}
        />
      )}
    </Field>
  );
}
