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
import { Spinner } from '@/components/ui/spinner';
import { useSetupSubmitUpload } from '@/hooks/tanstack-query/use-setup-submit-upload';
import { toastError, toastSuccess } from '@/lib/toast';

import { Stepper } from '../-stepper';

export const Route = createLazyFileRoute('/_setup/upload')({
  component: SetupUploadPage,
});

function SetupUploadPage(): React.JSX.Element {
  const router = useRouter();
  const [maxSize, setMaxSize] = useState(10485760);
  const [accepted, setAccepted] = useState('jpg;jpeg;png;pdf');
  const [maxFiles, setMaxFiles] = useState(10);

  const mutation = useSetupSubmitUpload({
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
      FILE_UPLOAD_MAX_SIZE: maxSize,
      FILE_UPLOAD_ACCEPTED: accepted,
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: maxFiles,
    });
  }

  return (
    <>
      <Stepper currentStep="upload" />
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Upload</CardTitle>
          <CardDescription>
            Defina os limites de upload de arquivos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="FILE_UPLOAD_MAX_SIZE">
                Tamanho máximo (bytes)
              </Label>
              <Input
                id="FILE_UPLOAD_MAX_SIZE"
                type="number"
                value={maxSize}
                onChange={(e) => setMaxSize(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="FILE_UPLOAD_ACCEPTED">
                Extensões aceitas (separadas por ;)
              </Label>
              <Input
                id="FILE_UPLOAD_ACCEPTED"
                type="text"
                value={accepted}
                onChange={(e) => setAccepted(e.target.value)}
                placeholder="jpg;jpeg;png;pdf"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="FILE_UPLOAD_MAX_FILES_PER_UPLOAD">
                Máximo de arquivos por upload
              </Label>
              <Input
                id="FILE_UPLOAD_MAX_FILES_PER_UPLOAD"
                type="number"
                value={maxFiles}
                onChange={(e) => setMaxFiles(Number(e.target.value))}
                required
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
