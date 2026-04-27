import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { WrenchIcon } from 'lucide-react';
import React from 'react';

import { TableMultiSelect } from '@/components/common/dynamic-table/table-selectors/table-multi-select';
import { AccessDenied } from '@/components/common/route-status/access-denied';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useCloneTable } from '@/hooks/tanstack-query/use-clone-table';
import { usePermission } from '@/hooks/use-table-permission';
import { handleApiError } from '@/lib/handle-api-error';
import type { ITable } from '@/lib/interfaces';
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

  const [models, setModels] = React.useState<Array<string>>([]);
  const [selectedTables, setSelectedTables] = React.useState<Array<ITable>>([]);
  const [copyDataTableIds, setCopyDataTableIds] = React.useState<Array<string>>(
    [],
  );
  const [prefix, setPrefix] = React.useState<string>('');

  const _clone = useCloneTable({
    onSuccess(data) {
      const total = data.tables?.length ?? 1;
      toastSuccess(
        total > 1 ? 'Tabelas clonadas' : 'Tabela clonada',
        total > 1
          ? `${total} tabelas foram clonadas com sucesso`
          : 'A tabela foi clonada com sucesso',
      );

      setModels([]);
      setSelectedTables([]);
      setCopyDataTableIds([]);
      setPrefix('');

      if (total === 1) {
        router.navigate({
          to: '/tables/$slug',
          params: {
            slug: data.slug,
          },
        });
      }
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
    if (models.length === 0 || isCloning) return;

    await _clone.mutateAsync({
      baseTableIds: models,
      copyDataTableIds,
      name: prefix.trim(),
    });
  };

  const handleModelsChange = React.useCallback(
    (value: Array<string>, tables?: Array<ITable>) => {
      setModels(value);
      setSelectedTables(tables ?? []);
      setCopyDataTableIds((current) =>
        current.filter((tableId) => value.includes(tableId)),
      );
    },
    [],
  );

  const toggleCopyData = React.useCallback((tableId: string) => {
    setCopyDataTableIds((current) =>
      current.includes(tableId)
        ? current.filter((id) => id !== tableId)
        : [...current, tableId],
    );
  }, []);

  return (
    <div
      className={`flex flex-col h-full overflow-hidden`}
      data-test-id="tools-page"
    >
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
                Crie uma ou mais tabelas com base nos modelos existentes
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4 max-w-md">
                <Field>
                  <FieldLabel>Modelos base</FieldLabel>
                  <TableMultiSelect
                    value={models}
                    onValueChange={handleModelsChange}
                    placeholder="Selecione um ou mais modelos"
                    disabled={isCloning}
                  />
                </Field>

                {selectedTables.length > 0 && (
                  <Field>
                    <FieldLabel>Transportar dados</FieldLabel>
                    <div className="space-y-2 rounded-md border p-3">
                      {selectedTables.map((table) => (
                        <label
                          key={table._id}
                          className="flex items-center gap-3 text-sm"
                        >
                          <Checkbox
                            checked={copyDataTableIds.includes(table._id)}
                            onCheckedChange={() => toggleCopyData(table._id)}
                            disabled={isCloning}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {table.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </Field>
                )}

                <Field>
                  <FieldLabel>Prefixo dos clones</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      placeholder="ex: clone_1_"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      disabled={isCloning}
                    />
                  </InputGroup>
                </Field>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={models.length === 0 || isCloning}
                    onClick={handleCloneTable}
                    data-test-id="tools-clone-btn"
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
