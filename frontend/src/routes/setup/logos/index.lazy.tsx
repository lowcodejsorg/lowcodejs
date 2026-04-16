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
import { useSetupSubmitLogos } from '@/hooks/tanstack-query/use-setup-submit-logos';
import { toastError, toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/setup/logos/')({
  component: SetupLogosPage,
});

function SetupLogosPage(): React.JSX.Element {
  const router = useRouter();
  const [logoSmallUrl, setLogoSmallUrl] = useState('');
  const [logoLargeUrl, setLogoLargeUrl] = useState('');

  const mutation = useSetupSubmitLogos({
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
    mutation.mutate({
      LOGO_SMALL_URL: logoSmallUrl || null,
      LOGO_LARGE_URL: logoLargeUrl || null,
    });
  }

  return (
    <>
      <Stepper currentStep="logos" />
      <Card>
        <CardHeader>
          <CardTitle>Logos</CardTitle>
          <CardDescription>
            Configure os logos da plataforma (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="LOGO_SMALL_URL">Logo Pequeno (URL)</Label>
              <Input
                id="LOGO_SMALL_URL"
                type="text"
                value={logoSmallUrl}
                onChange={(e) => setLogoSmallUrl(e.target.value)}
                placeholder="https://exemplo.com/logo-small.png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="LOGO_LARGE_URL">Logo Grande (URL)</Label>
              <Input
                id="LOGO_LARGE_URL"
                type="text"
                value={logoLargeUrl}
                onChange={(e) => setLogoLargeUrl(e.target.value)}
                placeholder="https://exemplo.com/logo-large.png"
              />
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
