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
import { useSetupSubmitPaging } from '@/hooks/tanstack-query/use-setup-submit-paging';
import { toastError, toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/setup/paging/')({
  component: SetupPagingPage,
});

function SetupPagingPage(): React.JSX.Element {
  const router = useRouter();
  const [perPage, setPerPage] = useState(20);

  const mutation = useSetupSubmitPaging({
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
    mutation.mutate({ PAGINATION_PER_PAGE: perPage });
  }

  return (
    <>
      <Stepper currentStep="paging" />
      <Card>
        <CardHeader>
          <CardTitle>Paginação</CardTitle>
          <CardDescription>Configure itens por página padrão</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="PAGINATION_PER_PAGE">Itens por página</Label>
              <Input
                id="PAGINATION_PER_PAGE"
                type="number"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
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
