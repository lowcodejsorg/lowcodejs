import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { FileTextIcon } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useSetupSubmitPaging } from '@/hooks/tanstack-query/use-setup-submit-paging';
import { toastError, toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/setup/paging/')({
  component: SetupPagingPage,
});

function SetupPagingPage(): React.JSX.Element {
  const router = useRouter();
  const [perPage, setPerPage] = useState('20');

  const mutation = useSetupSubmitPaging({
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
    mutation.mutate({ PAGINATION_PER_PAGE: Number(perPage) });
  }

  return (
    <>
      <Stepper currentStep="paging" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="size-5" />
            Paginação
          </CardTitle>
          <CardDescription>
            Configure o número padrão de itens por página nas listagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Field>
              <FieldLabel htmlFor="PAGINATION_PER_PAGE">
                Itens por página
              </FieldLabel>
              <div className="text-sm text-muted-foreground mb-2">
                Número padrão de registros exibidos por página nas tabelas e
                listagens
              </div>
              <Select
                value={perPage}
                onValueChange={setPerPage}
              >
                <SelectTrigger
                  id="PAGINATION_PER_PAGE"
                  className="w-full max-w-xs"
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </Field>

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
