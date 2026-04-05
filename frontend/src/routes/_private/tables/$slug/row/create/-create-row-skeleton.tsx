import { Field, FieldLabel } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';

export function CreateRowSkeleton(): React.JSX.Element {
  return (
    <section className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Field key={i}>
          <FieldLabel>
            <Skeleton className="h-4 w-20" />
          </FieldLabel>
          <Skeleton className="h-10 w-full rounded-md" />
        </Field>
      ))}

      {/* Botao */}
      <Field className="inline-flex justify-end flex-1 items-end">
        <Skeleton className="h-10 w-full max-w-3xs rounded-md" />
      </Field>
    </section>
  );
}
