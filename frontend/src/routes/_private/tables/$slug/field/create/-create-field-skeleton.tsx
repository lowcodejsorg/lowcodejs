import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

export function CreateFieldSkeleton(): React.JSX.Element {
  return (
    <section className="space-y-4 p-4">
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

      {/* Campo Tipo */}
      <Field>
        <FieldLabel>
          <Skeleton className="h-4 w-10" />
        </FieldLabel>
        <Skeleton className="h-10 w-full rounded-md" />
      </Field>

      {/* Toggles */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-row items-center justify-between rounded-lg border p-3"
        >
          <div className="space-y-0.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      ))}
    </section>
  );
}
