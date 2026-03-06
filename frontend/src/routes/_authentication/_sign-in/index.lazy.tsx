import { useForm } from '@tanstack/react-form';
import { Link, createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { EyeClosedIcon, EyeIcon, LockIcon, MailIcon } from 'lucide-react';
import React, { useState } from 'react';
import * as z from 'zod';

import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
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
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { useAuthenticationSignIn } from '@/hooks/tanstack-query/use-authentication-sign-in';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import { ROLE_DEFAULT_ROUTE } from '@/lib/menu/menu-access-permissions';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_authentication/_sign-in/')({
  component: RouteComponent,
});

const FormSignInSchema = z.object({
  email: z.email('Digite um email válido'),
  password: z
    .string({ message: 'A senha é obrigatória' })
    .min(1, 'A senha é obrigatória'),
});

function RouteComponent(): React.JSX.Element {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const signInMutation = useAuthenticationSignIn({
    onSuccess(response) {
      const role = response.group.slug.toUpperCase();

      const route = ROLE_DEFAULT_ROUTE[role];

      router.navigate({ to: route, replace: true });

      toastSuccess('Login realizado com sucesso!', 'Seja bem-vindo!');
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao fazer login',
        onFieldErrors: (errors) => {
          const setFieldError = createFieldErrorSetter(form);
          for (const [field, msg] of Object.entries(errors)) {
            setFieldError(field, msg);
          }
        },
      });
    },
  });

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: FormSignInSchema,
      onSubmit: FormSignInSchema,
    },
    onSubmit: async function ({ value: payload }) {
      await signInMutation.mutateAsync(payload);
    },
  });

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <Link
                  to="/"
                  className="flex flex-col items-center gap-2 font-medium"
                >
                  <Logo className="h-8" />
                </Link>
                <FieldDescription>
                  Não possui uma conta?{' '}
                  <Link
                    to="/sign-up"
                    className="underline underline-offset-2"
                  >
                    Clique aqui
                  </Link>
                </FieldDescription>
              </div>
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
                          id={field.name}
                          name={field.name}
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
              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                        />
                        <InputGroupAddon>
                          <LockIcon />
                        </InputGroupAddon>
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            type="button"
                            aria-label="toggle password visibility"
                            title="toggle password visibility"
                            size="icon-xs"
                            className="cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {!showPassword && <EyeIcon />}
                            {showPassword && <EyeClosedIcon />}
                          </InputGroupButton>
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
                  type="submit"
                  className="w-full"
                  disabled={signInMutation.status === 'pending'}
                >
                  {signInMutation.status === 'pending' && <Spinner />}
                  <span>Entrar</span>
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
}
