import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon, MailIcon } from 'lucide-react';
import React, { useState } from 'react';
import * as z from 'zod';

import { Logo } from '@/components/common/layout/logo';
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
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';

const EmailSchema = z.object({
  email: z.email('Digite um email válido'),
});

export function StepEmail({
  onNext,
}: {
  onNext: (email: string) => void;
}): React.JSX.Element {
  const [isPending, setIsPending] = useState(false);

  const form = useForm({
    defaultValues: { email: '' },
    validators: {
      onChange: EmailSchema,
      onSubmit: EmailSchema,
    },
    onSubmit: async function ({ value }) {
      setIsPending(true);
      await new Promise((r) => setTimeout(r, 600));
      setIsPending(false);
      onNext(value.email);
    },
  });

  return (
    <form
      data-test-id="forgot-password-email-form"
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
            Digite seu e-mail para receber o código de verificação
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
                    data-test-id="forgot-password-email-input"
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="exemplo@mail.com"
                    value={field.state.value.trim()}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value.trim())}
                    aria-invalid={isInvalid}
                  />
                  <InputGroupAddon>
                    <MailIcon />
                  </InputGroupAddon>
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <Field>
          <Button
            data-test-id="forgot-password-send-btn"
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending && <Spinner />}
            <span>Enviar código</span>
          </Button>
        </Field>

        <FieldDescription className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1"
          >
            <ArrowLeftIcon className="h-3 w-3" />
            Voltar para o login
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
