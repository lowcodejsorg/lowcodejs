import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import React, { useState } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useSetupSubmitName } from '@/hooks/tanstack-query/use-setup-submit-name';
import { toastError, toastSuccess } from '@/lib/toast';

import { Stepper } from '../-stepper';

export const Route = createLazyFileRoute('/_setup/name')({
  component: SetupNamePage,
});

function SetupNamePage(): React.JSX.Element {
  const router = useRouter();
  const [systemName, setSystemName] = useState('');
  const [locale, setLocale] = useState('pt-br');

  const mutation = useSetupSubmitName({
    onSuccess: () => {
      toastSuccess('Etapa concluída!');
      router.invalidate();
    },
    onError: () => {
      toastError('Erro ao salvar');
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    mutation.mutate({ SYSTEM_NAME: systemName, LOCALE: locale });
  }

  return (
    <>
      <Stepper currentStep="name" />
      <Card>
        <CardHeader>
          <CardTitle>Identidade do Sistema</CardTitle>
          <CardDescription>
            Configure o nome e idioma padrão da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="SYSTEM_NAME">Nome do Sistema</Label>
              <Input
                id="SYSTEM_NAME"
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="Minha Plataforma"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="LOCALE">Idioma</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger id="LOCALE">
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                  <SelectItem value="en-us">English (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.status === 'pending'}
            >
              {mutation.status === 'pending' && <Spinner />}
              Salvar e continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
