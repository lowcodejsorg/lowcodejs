import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

export function UpdateUserFormSkeleton(): React.JSX.Element {
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
          <InputGroupAddon>
            <Skeleton className="size-5 rounded" />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {/* Campo Email */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-16" />
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            disabled
            className="opacity-50"
          />
          <InputGroupAddon>
            <Skeleton className="size-5 rounded" />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {/* Campo Senha */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-32" />
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            disabled
            className="opacity-50"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              disabled
              type="button"
            >
              <Skeleton className="size-5 rounded" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {/* Campo Status */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="inline-flex space-x-2 items-center">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-11 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>

      {/* Campo Grupo */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-16" />
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
