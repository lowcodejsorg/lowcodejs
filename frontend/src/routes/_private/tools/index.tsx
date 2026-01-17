import React from 'react';
import {
  createFileRoute,
  useRouter,
} from '@tanstack/react-router';
import { WrenchIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupInput,
} from '@/components/ui/input-group';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useReadTables } from '@/hooks/tanstack-query/use-table-read';
import { API } from '@/lib/api';

import styles from './tools.module.css';

export const Route = createFileRoute('/_private/tools/')({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();

  const { data: tables = [], isLoading } = useReadTables();

  const [isCloning, setIsCloning] = React.useState(false);
  const [model, setModel] = React.useState<string>('');
  const [tableName, setTableName] = React.useState<string>('');
  const [search, setSearch] = React.useState<string>('');

  const handleCloneTable = async () => {
    if (!model || !tableName || isCloning) return;

    try {
      setIsCloning(true);

      const response = await API.post('/tools/clone-table', {
        baseTableId: model,
        name: tableName,
      });

      const { slug } = response.data;

      router.navigate({
        to: '/tables/$slug',
        params: {
          slug,
        },
        search: {
          page: 1,
          perPage: 20,
        },
      });

      setModel('');
      setTableName('');
    } catch (error) {
      console.error('Erro ao clonar tabela:', error);
    } finally {
      setIsCloning(false);
    }
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

  const filteredModels = React.useMemo(() => {
    return models.filter((m) =>
      m.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [models, search]);

  return (
    <div className={`flex flex-col h-full overflow-hidden ${styles.hideSearch}`}>
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <h1 className="text-xl font-medium">Ferramentas do Sistema</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
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

                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma tabela" />
                  </SelectTrigger>

                  <SelectContent className={styles.fixedSelectContent}>
                    <div className={styles.fixedSelectList}>
                      {isLoading ? (
                        <div className={styles.emptyState}>
                          Carregando tabelas...
                        </div>
                      ) : filteredModels.length === 0 ? (
                        <div className={styles.emptyState}>
                          Nenhuma tabela encontrada
                        </div>
                      ) : (
                        filteredModels.map((item) => (
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
                  {isCloning ? 'Clonando...' : 'Clonar Modelo'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
