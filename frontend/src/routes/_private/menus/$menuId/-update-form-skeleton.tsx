import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { FileTextIcon, FolderTreeIcon } from 'lucide-react';

export function UpdateMenuFormSkeleton() {
  return (
    <section className="space-y-4 p-2">
      {/* Nome */}
      <Field>
        <FieldLabel>
          Nome <span className="text-destructive">*</span>
        </FieldLabel>
        <InputGroup>
          <Skeleton className="h-10 w-full" />
          <InputGroupAddon>
            <FileTextIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {/* Tipo */}
      <Field>
        <FieldLabel>
          Tipo <span className="text-destructive">*</span>
        </FieldLabel>
        <Skeleton className="h-10 w-full" />
      </Field>

      {/* Campo condicional (Tabela, HTML, ou URL) */}
      <Field>
        <FieldLabel>Campo Específico</FieldLabel>
        <Skeleton className="h-10 w-full" />
      </Field>

      {/* Parent */}
      <Field>
        <FieldLabel>Menu Pai</FieldLabel>
        <InputGroup>
          <Skeleton className="h-10 w-full" />
          <InputGroupAddon>
            <FolderTreeIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {/* Buttons */}
      <Field className="inline-flex justify-end flex-1 items-end">
        <Skeleton className="h-10 w-24" />
      </Field>
    </section>
  );
}
