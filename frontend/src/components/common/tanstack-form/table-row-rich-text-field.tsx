import { Suspense, lazy } from 'react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

const Editor = lazy(() =>
  import('@/components/common/editor').then((m) => ({
    default: m.Editor,
  })),
);

const ContentViewer = lazy(() =>
  import('@/components/common/editor').then((m) => ({
    default: m.ContentViewer,
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
  const errorId = `${formField.name}-error`;
  const isRequired = field.required;

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
          <Editor
            value={formField.state.value || ''}
            onChange={(value) => formField.handleChange(value)}
            variant={compact ? 'compact' : 'default'}
            showToolbar={!compact}
            showBubble={!compact}
          />
        </Suspense>
      </div>
      {isInvalid && (
        <FieldError
          id={errorId}
          errors={formField.state.meta.errors}
        />
      )}
    </Field>
  );
}
