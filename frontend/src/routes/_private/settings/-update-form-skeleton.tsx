import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

export function UpdateSettingFormSkeleton(): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      {/* Idioma do Sistema */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel>
              <Skeleton className="h-4 w-32" />
            </FieldLabel>
            <Skeleton className="h-10 w-full max-w-xs rounded-md" />
          </Field>
        </CardContent>
      </Card>

      {/* Logos */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                <Skeleton className="h-4 w-24" />
              </FieldLabel>
              <Skeleton className="h-32 w-full rounded-md" />
            </Field>
            <Field>
              <FieldLabel>
                <Skeleton className="h-4 w-24" />
              </FieldLabel>
              <Skeleton className="h-32 w-full rounded-md" />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Upload de Arquivos */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                <Skeleton className="h-4 w-40" />
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
            <Field>
              <FieldLabel>
                <Skeleton className="h-4 w-40" />
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
          </div>
          <Field>
            <FieldLabel>
              <Skeleton className="h-4 w-48" />
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                disabled
                className="opacity-50"
              />
            </InputGroup>
          </Field>
        </CardContent>
      </Card>

      {/* Paginação */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel>
              <Skeleton className="h-4 w-32" />
            </FieldLabel>
            <Skeleton className="h-4 w-full max-w-md mb-2" />
            <Skeleton className="h-10 w-full max-w-xs rounded-md" />
          </Field>
        </CardContent>
      </Card>

      {/* Banco de Dados */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel>
              <Skeleton className="h-4 w-32" />
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
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          <Field>
            <FieldLabel>
              <Skeleton className="h-4 w-32" />
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                disabled
                className="opacity-50"
              />
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel>
              <Skeleton className="h-4 w-32" />
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
        </CardContent>
      </Card>

      {/* Botão */}
      <Field className="inline-flex justify-end flex-1 items-end">
        <Skeleton className="h-10 w-full max-w-3xs rounded-md" />
      </Field>
    </section>
  );
}
