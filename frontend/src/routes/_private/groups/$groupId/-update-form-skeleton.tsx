import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

export function UpdateGroupFormSkeleton() {
  return (
    <section className="space-y-4 p-2">
      {/* Campo Slug */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-32" />
        </FieldLabel>
        <InputGroup>
          <InputGroupInput disabled className="opacity-50" />
          <InputGroupAddon>
            <Skeleton className="size-5 rounded" />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {/* Campo Nome */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-12" />
        </FieldLabel>
        <InputGroup>
          <InputGroupInput disabled className="opacity-50" />
          <InputGroupAddon>
            <Skeleton className="size-5 rounded" />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {/* Campo Descrição */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-32" />
        </FieldLabel>
        <Skeleton className="h-20 w-full rounded-md" />
      </Field>

      {/* Campo Permissões */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-24" />
        </FieldLabel>
        <Skeleton className="h-10 w-full rounded-md" />
      </Field>

      {/* Botão */}
      <Field className="inline-flex justify-end flex-1 items-end">
        <Skeleton className="h-10 w-full max-w-3xs rounded-md" />
      </Field>
    </section>
  );
}
