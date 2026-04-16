import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useSetupSubmitAdmin } from '@/hooks/tanstack-query/use-setup-submit-admin';
import { toastError, toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/setup/admin/')({
  component: SetupAdminPage,
});

function SetupAdminPage(): React.JSX.Element {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useSetupSubmitAdmin({
    onSuccess: (data) => {
      toastSuccess('Etapa concluída!');
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
    mutation.mutate({ name, email, password, confirmPassword });
  }

  return (
    <>
      <Stepper currentStep="admin" />
      <Card>
        <CardHeader>
          <CardTitle>Criar Administrador</CardTitle>
          <CardDescription>
            Crie a conta do administrador principal da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do administrador"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.status === 'pending'}
            >
              {mutation.status === 'pending' && <Spinner />}
              Criar e continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
