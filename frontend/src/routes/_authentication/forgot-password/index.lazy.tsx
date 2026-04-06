import { useForm } from '@tanstack/react-form';
import { Link, createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon, MailIcon } from 'lucide-react';
import React from 'react';
import * as z from 'zod';

import { Logo } from '@/components/common/layout/logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { useAuthenticationRequestCode } from '@/hooks/tanstack-query/use-authentication-request-code';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_authentication/forgot-password/')({
  component: RouteComponent,
});

const EmailSchema = z.object({
  email: z.email('Digite um email válido'),
});

function RouteComponent(): React.JSX.Element {
  const router = useRouter();

  const requestCodeMutation = useAuthenticationRequestCode({
    onSuccess() {
      toastSuccess(
        'Código enviado!',
        'Verifique seu e-mail para obter o código.',
      );
      router.navigate({
        to: '/forgot-password/validate-code',
        search: { email: form.state.values.email },
      });
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao enviar código',
        onFieldErrors: (errors) => {
          const setFieldError = createFieldErrorSetter(form);
          for (const [field, msg] of Object.entries(errors)) {
            setFieldError(field, msg);
          }
        },
        causeHandlers: {
          EMAIL_NOT_FOUND: () => {
            const setFieldError = createFieldErrorSetter(form);
            setFieldError('email', 'E-mail não encontrado');
          },
        },
      });
    },
  });

  const form = useForm({
    defaultValues: { email: '' },
    validators: {
      onChange: EmailSchema,
      onSubmit: EmailSchema,
    },
    onSubmit: async function ({ value }) {
      await requestCodeMutation.mutateAsync(value);
    },
  });

  return (
    <div
      data-test-id="forgot-password-page"
      className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Link
            to="/"
            className="flex flex-col items-center gap-2 font-medium"
          >
            <Logo className="h-8" />
          </Link>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-semibold">
                Recuperar senha
              </CardTitle>
              <CardDescription>
                Digite seu e-mail para receber o código de verificação
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                data-test-id="forgot-password-email-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
              >
                <FieldGroup>
                  <form.Field
                    name="email"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>E-mail</FieldLabel>
                          <InputGroup>
                            <InputGroupInput
                              data-test-id="forgot-password-email-input"
                              id={field.name}
                              name={field.name}
                              type="email"
                              placeholder="exemplo@mail.com"
                              value={field.state.value.trim()}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value.trim())
                              }
                              aria-invalid={isInvalid}
                            />
                            <InputGroupAddon>
                              <MailIcon />
                            </InputGroupAddon>
                          </InputGroup>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />

                  <Field>
                    <Button
                      data-test-id="forgot-password-send-btn"
                      type="submit"
                      className="w-full"
                      disabled={requestCodeMutation.status === 'pending'}
                    >
                      {requestCodeMutation.status === 'pending' && <Spinner />}
                      <span>Enviar código</span>
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm">
            <FieldDescription>
              <Link
                to="/"
                className="inline-flex items-center gap-1"
              >
                <ArrowLeftIcon className="h-3 w-3" />
                Voltar para o login
              </Link>
            </FieldDescription>
          </div>
        </div>
      </div>
    </div>
  );
}
