import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { ImageIcon } from 'lucide-react';
import React, { useState } from 'react';

import { Stepper } from '../-stepper';

import { FileUploadWithStorage } from '@/components/common/file-upload';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useSetupSubmitLogos } from '@/hooks/tanstack-query/use-setup-submit-logos';
import type { IStorage } from '@/lib/interfaces';
import { toastError, toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/setup/logos/')({
  component: SetupLogosPage,
});

function SetupLogosPage(): React.JSX.Element {
  const router = useRouter();
  const [logoSmallUrl, setLogoSmallUrl] = useState<string | null>(null);
  const [logoLargeUrl, setLogoLargeUrl] = useState<string | null>(null);
  const [logoSmallFiles, setLogoSmallFiles] = useState<Array<File>>([]);
  const [logoLargeFiles, setLogoLargeFiles] = useState<Array<File>>([]);

  const mutation = useSetupSubmitLogos({
    onSuccess: (data) => {
      toastSuccess('Etapa concluída');
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
      LOGO_SMALL_URL: logoSmallUrl,
      LOGO_LARGE_URL: logoLargeUrl,
    });
  }

  return (
    <>
      <Stepper currentStep="logos" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" />
            Logos
          </CardTitle>
          <CardDescription>
            Configure os logos da plataforma (opcional — pode ser feito depois
            em Configurações)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Logo Pequeno</FieldLabel>
                <FileUploadWithStorage
                  value={logoSmallFiles}
                  onValueChange={setLogoSmallFiles}
                  onStorageChange={(storages: Array<IStorage>) => {
                    if (storages[0]?.url) {
                      setLogoSmallUrl(storages[0].url);
                    }
                  }}
                  accept="image/*"
                  maxFiles={1}
                  maxSize={4 * 1024 * 1024}
                  placeholder="Arraste ou selecione o logo pequeno"
                  shouldDeleteFromStorage={false}
                  staticName="logo-small"
                />
              </Field>

              <Field>
                <FieldLabel>Logo Grande</FieldLabel>
                <FileUploadWithStorage
                  value={logoLargeFiles}
                  onValueChange={setLogoLargeFiles}
                  onStorageChange={(storages: Array<IStorage>) => {
                    if (storages[0]?.url) {
                      setLogoLargeUrl(storages[0].url);
                    }
                  }}
                  accept="image/*"
                  maxFiles={1}
                  maxSize={4 * 1024 * 1024}
                  placeholder="Arraste ou selecione o logo grande"
                  shouldDeleteFromStorage={false}
                  staticName="logo-large"
                />
              </Field>
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
