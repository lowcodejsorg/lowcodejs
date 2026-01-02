import {
  createFileRoute,
  useNavigate,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import {
  CreateRowFormFields,
  buildDefaultValues,
  buildPayload,
} from './-create-form';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useCreateTableRow } from '@/hooks/tanstack-query/use-table-row-create';

export const Route = createFileRoute('/_private/tables/$slug/row/create/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();

  const { slug } = useParams({
    from: '/_private/tables/$slug/row/create/',
  });

  const table = useReadTable({ slug });

  const activeFields = React.useMemo(() => {
    if (table.status !== 'success') return [];
    return table.data.fields.filter((f) => !f.trashed);
  }, [table.status, table.data?.fields]);

  const _create = useCreateTableRow({
    onSuccess() {
      toast('Registro criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O registro foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      sidebar.setOpen(false);
      navigate({
        to: '/tables/$slug',
        replace: true,
        params: { slug },
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;

        if (
          errorData?.code === 400 &&
          errorData?.cause === 'INVALID_PARAMETERS'
        ) {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Dados inválidos',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 401 &&
          errorData?.cause === 'AUTHENTICATION_REQUIRED'
        ) {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Autenticação necessária',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 403 && errorData?.cause === 'ACCESS_DENIED') {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Permissões insuficientes',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 404 && errorData?.cause === 'TABLE_NOT_FOUND') {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Coleção não encontrada',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 422 &&
          errorData?.cause === 'UNPROCESSABLE_ENTITY'
        ) {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Dados inválidos',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 500 && errorData?.cause === 'SERVER_ERROR') {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Erro interno do servidor',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        toast('Erro ao criar o registro', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao criar o registro',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues:
      table.status === 'success' ? buildDefaultValues(activeFields) : {},
    onSubmit: async ({ value }) => {
      if (_create.status === 'pending') return;
      if (table.status !== 'success') return;

      const data = buildPayload(value, activeFields);
      await _create.mutateAsync({ slug, data });
    },
  });

  if (table.status === 'pending') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
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
            <h1 className="text-xl font-medium">Novo registro</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (table.status === 'error') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
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
            <h1 className="text-xl font-medium">Novo registro</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-destructive">Erro ao carregar dados da tabela</p>
        </div>
      </div>
    );
  }

  const isPending = _create.status === 'pending';

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
          <h1 className="text-xl font-medium">Novo registro</h1>
        </div>
      </div>

      {/* Content */}
      <form
        className="flex-1 flex flex-col min-h-0 overflow-auto relative"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <CreateRowFormFields
          form={form}
          activeFields={activeFields}
          disabled={isPending}
          tableSlug={slug}
        />
      </form>

      {/* Footer com botões */}
      <div className="shrink-0 border-t p-2">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                className="w-full max-w-3xs"
                disabled={isSubmitting}
                onClick={() => {
                  sidebar.setOpen(false);
                  navigate({
                    to: '/tables/$slug',
                    replace: true,
                    params: { slug },
                  });
                }}
              >
                <span>Cancelar</span>
              </Button>
              <Button
                type="button"
                className="w-full max-w-3xs"
                disabled={!canSubmit}
                onClick={() => form.handleSubmit()}
              >
                {isSubmitting && <Spinner />}
                <span>Criar</span>
              </Button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
