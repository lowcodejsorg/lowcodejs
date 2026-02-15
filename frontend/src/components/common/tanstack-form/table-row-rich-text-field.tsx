import { Suspense, lazy } from 'react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

// Lazy load do editor pesado
const EditorExample = lazy(() =>
  import('@/components/common/editor').then((m) => ({
    default: m.EditorExample,
  })),
);

function EditorSkeleton(): React.JSX.Element {
  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex gap-2 flex-wrap border-b pb-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-6 w-6"
          />
        ))}
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

interface TableRowRichTextFieldProps {
  field: IField;
  disabled?: boolean;
  compact?: boolean;
}

export function TableRowRichTextField({
  field,
  disabled,
  compact = false,
}: TableRowRichTextFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const isInvalid =
    formField.state.meta.isDirty && !formField.state.meta.isValid;
  const isRequired = field.required;

  // Se disabled, mostrar apenas preview
  if (disabled) {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <div className="border rounded-md p-4 bg-muted min-h-25">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: formField.state.value || '<p>Sem conteudo</p>',
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
        <Suspense fallback={<EditorSkeleton />}>
          <EditorExample
            value={formField.state.value || ''}
            onChange={(value) => formField.handleChange(value)}
            variant={compact ? 'compact' : 'default'}
            toolbarVariant={compact ? 'minimal' : 'default'}
            showBubble={!compact}
          />
        </Suspense>
      </div>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
