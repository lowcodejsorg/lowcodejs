import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';

const CodeSchema = z.object({
  code: z
    .string({ message: 'O código é obrigatório' })
    .length(6, 'O código deve ter 6 dígitos'),
});

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return email;
  const visible = local.slice(0, 2);
  const masked = '*'.repeat(Math.min(local.length - 2, 4));
  return `${visible}${masked}@${domain}`;
}

export function StepCode({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: (code: string) => void;
  onBack: () => void;
}): React.JSX.Element {
  const [isPending, setIsPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [codeValue, setCodeValue] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = CodeSchema.safeParse({ code: codeValue });
    if (!result.success) {
      setCodeError(result.error.issues[0]?.message ?? 'Código inválido');
      return;
    }
    setCodeError(null);
    setIsPending(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsPending(false);
    onNext(codeValue);
  }

  async function handleResend() {
    setResendPending(true);
    await new Promise((r) => setTimeout(r, 600));
    setResendPending(false);
    setCodeValue('');
    setCodeError(null);
  }

  return (
    <form
      data-test-id="forgot-password-code-form"
      onSubmit={handleSubmit}
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
            Digite o código de 6 dígitos enviado para{' '}
            <span className="text-foreground font-medium">
              {maskEmail(email)}
            </span>
          </FieldDescription>
        </div>

        <Field data-invalid={!!codeError}>
          <FieldLabel>Código de verificação</FieldLabel>
          <div className="flex justify-center">
            <InputOTP
              data-test-id="forgot-password-otp-input"
              maxLength={6}
              value={codeValue}
              onChange={(value) => {
                setCodeValue(value);
                if (codeError) setCodeError(null);
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {codeError && <FieldError>{codeError}</FieldError>}
        </Field>

        <Field>
          <Button
            data-test-id="forgot-password-verify-btn"
            type="submit"
            className="w-full"
            disabled={isPending || codeValue.length < 6}
          >
            {isPending && <Spinner />}
            <span>Verificar código</span>
          </Button>
        </Field>

        <FieldDescription className="text-center">
          Não recebeu o código?{' '}
          <button
            type="button"
            className="underline underline-offset-2 disabled:opacity-50"
            disabled={resendPending}
            onClick={handleResend}
          >
            {resendPending ? 'Reenviando...' : 'Reenviar'}
          </button>
        </FieldDescription>

        <FieldDescription className="text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1 underline underline-offset-2"
            onClick={onBack}
          >
            <ArrowLeftIcon className="h-3 w-3" />
            Voltar
          </button>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
