import { useForm } from '@tanstack/react-form';
import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import {
  EyeClosedIcon,
  EyeIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
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
import { useAuthenticationSignUp } from '@/hooks/tanstack-query/use-authentication-sign-up';
import type { IHTTPExeptionError } from '@/lib/interfaces';

export const Route = createFileRoute('/_authentication/sign-up/')({
  component: RouteComponent,
});

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;

const FormSignUpSchema = z
  .object({
    name: z
      .string({ message: 'O nome é obrigatório' })
      .min(1, 'O nome é obrigatório'),
    email: z
      .string({ message: 'O email é obrigatório' })
      .email('Digite um email válido'),
    password: z
      .string({ message: 'A senha é obrigatória' })
      .min(6, 'A senha deve ter no mínimo 6 caracteres')
      .regex(
        passwordRegex,
        'A senha deve conter: 1 maiúscula, 1 minúscula, 1 número e 1 especial',
      ),
    confirmPassword: z
      .string({ message: 'A confirmação de senha é obrigatória' })
      .min(1, 'A confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

function RouteComponent(): React.JSX.Element {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const signUpMutation = useAuthenticationSignUp({
    onSuccess() {
      router.navigate({ to: '/', replace: true });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as IHTTPExeptionError<
          Partial<
            Pick<
              z.infer<typeof FormSignUpSchema>,
              'name' | 'email' | 'password'
            >
          >
        >;

        // 400 - Validation errors
        if (data.cause === 'INVALID_PAYLOAD_FORMAT' && data.code === 400) {
          if (data.errors['name']) setFieldError('name', data.errors['name']);

          if (data.errors['email'])
            setFieldError('email', data.errors['email']);

          if (data.errors['password'])
            setFieldError('password', data.errors['password']);

          return;
        }

        // 409 - User already exists
        if (data.cause === 'USER_ALREADY_EXISTS' && data.code === 409) {
          setFieldError('email', 'Este email já está em uso');
          return;
        }
      }

      toast('Erro ao criar conta', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Tente novamente mais tarde',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  function setFieldError(
    field: keyof Pick<
      z.infer<typeof FormSignUpSchema>,
      'name' | 'email' | 'password'
    >,
    message: string,
  ): void {
    form.setFieldMeta(field, (prev) => {
      return {
        ...prev,
        isTouched: true,
        errors: [{ message }],
        errorMap: { onSubmit: { message } },
      };
    });
  }

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: FormSignUpSchema,
    },
    onSubmit: async function ({ value: payload }) {
      const { confirmPassword, ...data } = payload;
      await signUpMutation.mutateAsync(data);
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
                  <Logo />
                </Link>
                <FieldDescription>
                  Já possui uma conta?{' '}
                  <Link
                    to="/"
                    className="underline underline-offset-2"
                  >
                    Faça login
                  </Link>
                </FieldDescription>
              </div>
              <form.Field
                name="name"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          type="text"
                          placeholder="Seu nome completo"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                        />
                        <InputGroupAddon>
                          <UserIcon />
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
                          type="email"
                          placeholder="exemplo@mail.com"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
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
              <form.Field
                name="confirmPassword"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Confirmar Senha
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          type={showConfirmPassword ? 'text' : 'password'}
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
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {!showConfirmPassword && <EyeIcon />}
                            {showConfirmPassword && <EyeClosedIcon />}
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
                  disabled={signUpMutation.status === 'pending'}
                >
                  {signUpMutation.status === 'pending' && <Spinner />}
                  <span>Criar conta</span>
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
}
