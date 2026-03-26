import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { WrenchIcon } from 'lucide-react';
import React from 'react';

import { AccessDenied } from '@/components/common/route-status/access-denied';
import { TableComboboxPaginated } from '@/components/common/table-selectors/table-combobox-paginated';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useCloneTable } from '@/hooks/tanstack-query/use-clone-table';
import { usePermission } from '@/hooks/use-table-permission';
import { handleApiError } from '@/lib/handle-api-error';
import { toastError, toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_private/tools/')({
  component: RouteComponent,
});

function ToolsSkeleton(): React.JSX.Element {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function RouteComponent(): React.JSX.Element {
  const router = useRouter();
  const permission = usePermission();

  const [model, setModel] = React.useState<string>('');
  const [tableName, setTableName] = React.useState<string>('');

  const _clone = useCloneTable({
    onSuccess(data) {
      toastSuccess('Tabela clonada', 'A tabela foi clonada com sucesso');

      setModel('');
      setTableName('');

      router.navigate({
        to: '/tables/$slug',
        params: {
          slug: data.slug,
        },
      });
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao clonar tabela',
        causeHandlers: {
          TABLE_NOT_FOUND: () =>
            toastError(
              'Modelo não encontrado',
              'A tabela modelo selecionada não foi encontrada',
            ),
        },
      });
    },
  });

  const isCloning = _clone.status === 'pending';

  const handleCloneTable = async (): Promise<void> => {
    if (!model || !tableName || isCloning) return;

    await _clone.mutateAsync({
      baseTableId: model,
      name: tableName.trim(),
    });
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden`}>
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <h1 className="text-xl font-medium">Ferramentas do Sistema</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {permission.isLoading && <ToolsSkeleton />}
        {!permission.isLoading && !permission.can('CREATE_TABLE') && (
          <AccessDenied />
        )}
        {!permission.isLoading && permission.can('CREATE_TABLE') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WrenchIcon className="w-5 h-5" />
                Clonar Modelos de Tabela
              </CardTitle>
              <CardDescription>
                Crie uma nova tabela com base em uma tabela existente
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4 max-w-md">
                <Field>
                  <FieldLabel>Modelo base</FieldLabel>
                  <TableComboboxPaginated
                    value={model}
                    onValueChange={(value) => setModel(value)}
                    placeholder="Selecione um modelo"
                  />
                </Field>

                <Field>
                  <FieldLabel>Nome da nova tabela</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      placeholder="ex: Atividades"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                    />
                  </InputGroup>
                </Field>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={!model || !tableName || isCloning}
                    onClick={handleCloneTable}
                  >
                    {isCloning && <Spinner />}
                    <span>{isCloning ? 'Clonando...' : 'Clonar Modelo'}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
