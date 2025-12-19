import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

export function UpdateProfileFormSkeleton() {
  return (
    <section className="space-y-4 p-2">
      {/* Nome */}
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

      {/* Email */}
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

      {/* Grupo (card read-only) */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="rounded-lg border p-4 bg-muted/50">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>

      {/* Switch Change Password */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
      </div>

      {/* Botão */}
      <Field className="inline-flex justify-end flex-1 items-end">
        <Skeleton className="h-10 w-full max-w-3xs rounded-md" />
      </Field>
    </section>
  );
}
