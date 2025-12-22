import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

export function UpdateRowFormSkeleton(): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      {/* Simular 4 campos de texto */}
      {[1, 2, 3, 4].map((i) => (
        <Field key={i}>
          <FieldLabel>
            <Skeleton className="h-4 w-20" />
          </FieldLabel>
          <InputGroup>
            <InputGroupInput disabled className="opacity-50" />
          </InputGroup>
        </Field>
      ))}

      {/* Simular um campo de seleção */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-24" />
        </FieldLabel>
        <Skeleton className="h-10 w-full rounded-md" />
      </Field>

      {/* Simular um campo de arquivo */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-16" />
        </FieldLabel>
        <Skeleton className="h-24 w-full rounded-md" />
      </Field>

      {/* Botão */}
      <Field className="inline-flex justify-end flex-1 items-end">
        <Skeleton className="h-10 w-full max-w-3xs rounded-md" />
      </Field>
    </section>
  );
}
