import { Suspense, lazy } from 'react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
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

interface FieldEditorProps {
  label: string;
  showPreview?: boolean;
}

export function FieldEditor({
  label,
  showPreview,
}: FieldEditorProps): React.JSX.Element {
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
          <Suspense fallback={<EditorSkeleton />}>
            <EditorExample
              value={field.state.value || ''}
              onChange={(value) => field.handleChange(value)}
            />
          </Suspense>
        </div>
      )}
      {showPreview && (
        <div className="border rounded-md p-4 bg-muted min-h-25">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: field.state.value || '<p>Sem conteudo</p>',
            }}
          />
        </div>
      )}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
