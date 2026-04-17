import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { EyeClosedIcon, EyeIcon, MailIcon } from 'lucide-react';
import React, { useState } from 'react';

import { Stepper } from '../-stepper';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { useSetupSubmitEmail } from '@/hooks/tanstack-query/use-setup-submit-email';
import { toastError, toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/setup/email/')({
  component: SetupEmailPage,
});

function SetupEmailPage(): React.JSX.Element {
  const router = useRouter();
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [from, setFrom] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useSetupSubmitEmail({
    onSuccess: (data) => {
      toastSuccess('Setup concluído');
      if (data.completed) {
        router.navigate({ to: '/' });
      } else if (data.currentStep) {
        router.navigate({ to: `/setup/${data.currentStep}` });
      }
    },
    onError: () => {
      toastError('Erro ao salvar');
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    mutation.mutate({
      EMAIL_PROVIDER_HOST: host || null,
      EMAIL_PROVIDER_PORT: port ? Number(port) : null,
      EMAIL_PROVIDER_USER: user || null,
      EMAIL_PROVIDER_PASSWORD: password || null,
      EMAIL_PROVIDER_FROM: from || null,
    });
  }

  function handleSkip(): void {
    mutation.mutate({});
  }

  return (
    <>
      <Stepper currentStep="email" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailIcon className="size-5" />
            Configuração de Email
          </CardTitle>
          <CardDescription>
            Configure o servidor SMTP (opcional — pode ser feito depois em
            Configurações)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="EMAIL_PROVIDER_HOST">
                  Host SMTP
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="EMAIL_PROVIDER_HOST"
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="smtp.exemplo.com"
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="EMAIL_PROVIDER_PORT">Porta</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="EMAIL_PROVIDER_PORT"
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="587"
                  />
                </InputGroup>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="EMAIL_PROVIDER_USER">Usuário</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="EMAIL_PROVIDER_USER"
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="usuario@exemplo.com"
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="EMAIL_PROVIDER_PASSWORD">Senha</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="EMAIL_PROVIDER_PASSWORD"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    aria-label="alternar visibilidade da senha"
                    title="Alternar visibilidade da senha"
                    size="icon-xs"
                    className="cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeClosedIcon /> : <EyeIcon />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="EMAIL_PROVIDER_FROM">
                Remetente (From)
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="EMAIL_PROVIDER_FROM"
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="noreply@exemplo.com"
                />
              </InputGroup>
            </Field>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                disabled={mutation.status === 'pending'}
                onClick={handleSkip}
              >
                {mutation.status === 'pending' && <Spinner />}
                Pular
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={mutation.status === 'pending'}
              >
                {mutation.status === 'pending' && <Spinner />}
                Salvar e concluir
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
