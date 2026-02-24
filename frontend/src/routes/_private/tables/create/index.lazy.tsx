import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  CreateTableFormFields,
  TableCreateSchema,
  tableCreateFormDefaultValues,
} from './-create-form';

import { AccessDenied } from '@/components/common/access-denied';
import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/uploading-context';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useCreateTable } from '@/hooks/tanstack-query/use-table-create';
import { usePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import type { IHTTPExeptionError } from '@/lib/interfaces';

export const Route = createLazyFileRoute('/_private/tables/create/')({
  component: RouteComponent,
});

function CreateFormSkeleton(): React.JSX.Element {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function RouteComponent(): React.JSX.Element {
  return (
    <UploadingProvider>
      <RouteComponentContent />
    </UploadingProvider>
  );
}

function RouteComponentContent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();
  const permission = usePermission();
  const isUploading = useIsUploading();

  function setFieldError(field: 'name', message: string): void {
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      isTouched: true,
      errors: [{ message }],
      errorMap: { onSubmit: { message } },
    }));
  }

  const _create = useCreateTable({
    onSuccess() {
      toast('Tabela criada', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A tabela foi criada com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      navigate({ to: '/tables', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as IHTTPExeptionError<{
          name?: string;
        }>;

        // 409 - Tabela já existe (TABLE_EXISTS)
        if (data.cause === 'TABLE_EXISTS' && data.code === 409) {
          setFieldError('name', 'Já existe uma tabela com este nome');
          return;
        }

        // 400 - Erros de validação (INVALID_PAYLOAD_FORMAT)
        if (data.cause === 'INVALID_PAYLOAD_FORMAT' && data.code === 400) {
          if (data.errors['name']) setFieldError('name', data.errors['name']);
          return;
        }

        // 500 - Erro interno (CREATE_TABLE_ERROR)
        if (data.cause === 'CREATE_TABLE_ERROR' && data.code === 500) {
          toast('Erro ao criar a tabela', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'Houve um erro ao criar a tabela. Tente novamente mais tarde.',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        toast('Erro ao criar a tabela', {
          className: '!bg-destructive !text-white !border-destructive',
          description: data.message || 'Erro ao criar a tabela',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
    },
  });

  const form = useAppForm({
    defaultValues: tableCreateFormDefaultValues,
    validators: {
      onSubmit: TableCreateSchema,
    },
    onSubmit: async ({ value }) => {
      if (_create.status === 'pending') return;

      await _create.mutateAsync({
        name: value.name.trim(),
        logo: value.logo,
        style: value.style,
        visibility: value.visibility,
      });
    },
  });

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
              sidebar.setOpen(true);
              router.navigate({
                to: '/tables',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Nova tabela</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {permission.isLoading && <CreateFormSkeleton />}
        {!permission.isLoading && !permission.can('CREATE_TABLE') && (
          <AccessDenied />
        )}
        {!permission.isLoading && permission.can('CREATE_TABLE') && (
          <form
            className="flex-1 flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <CreateTableFormFields
              form={form}
              isPending={isPending}
            />
          </form>
        )}
      </div>

      {/* Footer com botões */}
      {!permission.isLoading && permission.can('CREATE_TABLE') && (
        <div className="shrink-0 border-t p-2">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                  disabled={isSubmitting}
                  onClick={() => {
                    navigate({
                      to: '/tables',
                      search: { page: 1, perPage: 50 },
                    });
                  }}
                >
                  <span>Cancelar</span>
                </Button>
                <Button
                  type="button"
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                  disabled={!canSubmit || isUploading}
                  onClick={() => form.handleSubmit()}
                >
                  {isSubmitting && <Spinner />}
                  <span>Criar</span>
                </Button>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
