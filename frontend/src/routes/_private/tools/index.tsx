import { createFileRoute, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { WrenchIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import styles from './tools.module.css';

import { AccessDenied } from '@/components/common/access-denied';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useCloneTable } from '@/hooks/tanstack-query/use-clone-table';
import { useTablesReadPaginated } from '@/hooks/tanstack-query/use-tables-read-paginated';
import { usePermission } from '@/hooks/use-table-permission';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import type { IHTTPExeptionError } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tools/')({
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
  const { queryClient } = getContext();
  const permission = usePermission();

  const [model, setModel] = React.useState<string>('');
  const [tableName, setTableName] = React.useState<string>('');

  const { data: tablesData, isLoading } = useTablesReadPaginated();
  const tables = tablesData?.data ?? [];

  const _clone = useCloneTable({
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: ['/tables'],
      });

      queryClient.invalidateQueries({
        queryKey: ['/tables/paginated'],
      });

      toast('Tabela clonada', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A tabela foi clonada com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

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
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as IHTTPExeptionError<{
          name?: string;
          baseTableId?: string;
        }>;

        if (errorData.cause === 'TABLE_NOT_FOUND' && errorData.code === 404) {
          toast('Modelo não encontrado', {
            className: '!bg-destructive !text-white !border-destructive',
            description: 'A tabela modelo selecionada não foi encontrada',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        toast('Erro ao clonar tabela', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData.message || 'Erro ao clonar a tabela',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
        return;
      }

      toast('Erro ao clonar tabela', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Houve um erro interno ao clonar a tabela',
        descriptionClassName: '!text-white',
        closeButton: true,
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

  const models = React.useMemo(
    () =>
      tables.map((table) => ({
        value: String(table._id),
        label: table.name,
        slug: table.slug,
      })),
    [tables],
  );

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${styles.hideSearch}`}
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
                Crie uma nova tabela com base em uma tabela existente
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4 max-w-md">
                <Field>
                  <FieldLabel>Modelo base</FieldLabel>

                  <Select
                    value={model}
                    onValueChange={setModel}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma tabela" />
                    </SelectTrigger>

                    <SelectContent className={styles.fixedSelectContent}>
                      <div className={styles.fixedSelectList}>
                        {isLoading ? (
                          <div className={styles.emptyState}>
                            Carregando tabelas...
                          </div>
                        ) : models.length === 0 ? (
                          <div className={styles.emptyState}>
                            Nenhuma tabela encontrada
                          </div>
                        ) : (
                          models.map((item) => (
                            <SelectItem
                              key={item.value}
                              value={item.value}
                            >
                              {item.label}
                            </SelectItem>
                          ))
                        )}
                      </div>
                    </SelectContent>
                  </Select>
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
