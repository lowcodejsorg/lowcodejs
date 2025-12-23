import { useForm } from '@tanstack/react-form';
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';

import { CodeEditor } from '@/components/common/code-editor';
import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReadTable } from '@/integrations/tanstack-query/implementations/use-table-read';
import { useUpdateTable } from '@/integrations/tanstack-query/implementations/use-table-update';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import type { ITable } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/$slug/methods')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({ from: '/_private/tables/$slug/methods' });
  const sidebar = useSidebar();
  const router = useRouter();
  const table = useReadTable({ slug });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              sidebar.setOpen(false);
              router.navigate({
                to: '/tables/$slug',
                replace: true,
                params: { slug },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Métodos da tabela</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {table.status === 'error' && (
          <LoadError
            message="Erro ao buscar dados da tabela"
            refetch={table.refetch}
          />
        )}
        {table.status === 'pending' && (
          <div className="p-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-75 w-full" />
            <Skeleton className="h-10 w-32 ml-auto" />
          </div>
        )}
        {table.status === 'success' && (
          <MethodsForm
            data={table.data}
            tableSlug={slug}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}

interface MethodsFormProps {
  data: ITable;
  tableSlug: string;
}

function MethodsForm({ data, tableSlug }: MethodsFormProps): React.JSX.Element {
  const { queryClient } = getContext();

  const _update = useUpdateTable({
    onSuccess(response) {
      queryClient.setQueryData<ITable>(
        ['/tables/'.concat(tableSlug), tableSlug],
        response,
      );

      toast('Métodos atualizados', {
        className: '!bg-primary !text-primary-foreground !border-primary',
        description: 'Os métodos da tabela foram atualizados com sucesso',
        descriptionClassName: '!text-primary-foreground',
        closeButton: true,
      });
    },
    onError(error) {
      console.error(error);
      toast('Erro ao atualizar métodos', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Não foi possível atualizar os métodos da tabela',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  const form = useForm({
    defaultValues: {
      onLoad: data.methods.onLoad.code ?? '',
      beforeSave: data.methods.beforeSave.code ?? '',
      afterSave: data.methods.afterSave.code ?? '',
    },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      await _update.mutateAsync({
        slug: tableSlug,
        methods: {
          onLoad: {
            code: value.onLoad || null,
          },
          beforeSave: {
            code: value.beforeSave || null,
          },
          afterSave: {
            code: value.afterSave || null,
          },
        },
      });
    },
  });

  return (
    <form
      className="p-2"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <p className="text-sm text-muted-foreground mb-4">
        Configure scripts JavaScript que serão executados em diferentes momentos
        do ciclo de vida do registro.
      </p>

      <Tabs
        defaultValue="onLoad"
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger
            value="onLoad"
            className="flex-1"
          >
            Ao Carregar
          </TabsTrigger>
          <TabsTrigger
            value="beforeSave"
            className="flex-1"
          >
            Antes de Salvar
          </TabsTrigger>
          <TabsTrigger
            value="afterSave"
            className="flex-1"
          >
            Após Salvar
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="onLoad"
          className="mt-4"
        >
          <form.Field name="onLoad">
            {(field) => (
              <CodeEditor
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                label="Ao Carregar (OnLoad)"
                table={data}
              />
            )}
          </form.Field>
          <p className="text-sm text-muted-foreground mt-2">
            Executado quando o formulário é carregado. Use para pré-preencher
            campos ou aplicar regras de negócio iniciais.
          </p>
        </TabsContent>

        <TabsContent
          value="beforeSave"
          className="mt-4"
        >
          <form.Field name="beforeSave">
            {(field) => (
              <CodeEditor
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                label="Antes de Salvar (BeforeSave)"
                table={data}
              />
            )}
          </form.Field>
          <p className="text-sm text-muted-foreground mt-2">
            Executado antes de salvar o registro. Use para validações
            customizadas ou transformações de dados.
          </p>
        </TabsContent>

        <TabsContent
          value="afterSave"
          className="mt-4"
        >
          <form.Field name="afterSave">
            {(field) => (
              <CodeEditor
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                label="Após Salvar (AfterSave)"
                table={data}
              />
            )}
          </form.Field>
          <p className="text-sm text-muted-foreground mt-2">
            Executado após salvar o registro. Use para enviar notificações,
            atualizar registros relacionados ou executar ações pós-salvamento.
          </p>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button
          type="submit"
          disabled={_update.status === 'pending'}
        >
          {_update.status === 'pending' && <Spinner />}
          Salvar Métodos
        </Button>
      </div>
    </form>
  );
}
