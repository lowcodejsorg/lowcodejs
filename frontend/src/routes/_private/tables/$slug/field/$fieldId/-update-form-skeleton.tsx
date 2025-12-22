import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

export function UpdateFieldFormSkeleton(): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      {/* Campo Nome */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-12" />
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            disabled
            className="opacity-50"
          />
        </InputGroup>
      </Field>

      {/* Campo Tipo */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-10" />
        </FieldLabel>
        <Skeleton className="h-10 w-full rounded-md" />
      </Field>

      {/* Campo Formato */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-16" />
        </FieldLabel>
        <Skeleton className="h-10 w-full rounded-md" />
      </Field>

      {/* Campo Valor Padrão */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-24" />
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            disabled
            className="opacity-50"
          />
        </InputGroup>
      </Field>

      {/* Switch Múltiplos */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="inline-flex space-x-2 items-center">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-6 w-11 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>

      {/* Switch Filtro */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="inline-flex space-x-2 items-center">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-6 w-11 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>

      {/* Switch Listagem */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="inline-flex space-x-2 items-center">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-6 w-11 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>

      {/* Switch Obrigatoriedade */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="inline-flex space-x-2 items-center">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-6 w-11 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>

      {/* Switch Lixeira */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-52" />
        </div>
        <div className="inline-flex space-x-2 items-center">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-6 w-11 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>

      {/* Botão */}
      <Field className="inline-flex justify-end flex-1 items-end">
        <Skeleton className="h-10 w-full max-w-3xs rounded-md" />
      </Field>
    </section>
  );
}
