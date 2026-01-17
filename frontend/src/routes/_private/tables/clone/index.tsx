import {
  createFileRoute,
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
} from './-clone-form';

import { AccessDenied } from '@/components/common/access-denied';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useCreateTable } from '@/hooks/tanstack-query/use-table-create';
import { usePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import type { ITable, Paginated } from '@/lib/interfaces';
import { API } from '@/lib/api';

export const Route = createFileRoute('/_private/tables/clone/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();
  const permission = usePermission();

  // Loading enquanto verifica permissão
  if (permission.isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Mostrar erro se não tem permissão
  if (!permission.can('CREATE_TABLE')) {
    return <AccessDenied />;
  }

  const _create = useCreateTable({
    onSuccess(data) {
      queryClient.setQueryData<Paginated<ITable>>(
        ['/tables/paginated', { page: 1, perPage: 50 }],
        (cached) => {
          if (!cached) {
            return {
              meta: MetaDefault,
              data: [data],
            };
          }

          return {
            meta: {
              ...cached.meta,
              total: cached.meta.total + 1,
            },
            data: [data, ...cached.data],
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: ['/tables'],
      });

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
        const data = error.response?.data;

        toast('Erro ao criar a tabela', {
          className: '!bg-destructive !text-white !border-destructive',
          description: data?.message ?? 'Erro ao criar a tabela',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues: tableCreateFormDefaultValues,
    onSubmit: async ({ value }) => {
      const validation = TableCreateSchema.safeParse(value);

      if (!validation.success) return;
      if (_create.status === 'pending') return;

      try {  
        const response = await API.post('/tools/clone-table', {
          baseTableId: value.MODEL_CLONE_TABLES,
          name: value.name.trim(),
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
        
      } catch (error) {
        console.error('Erro ao clonar tabela:', error);
      } 
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
                to: '/tables/new',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Criar nova tabela utilizando modelo</h1>
        </div>
      </div>

      {/* Content */}
      <form
        className="flex-1 flex flex-col min-h-0 overflow-auto"
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
                  navigate({ to: '/tables/new' });
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