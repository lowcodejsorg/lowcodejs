import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon, PencilIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { GroupUpdateSchema, UpdateGroupFormFields } from './-update-form';
import type { GroupUpdateFormValues } from './-update-form';
import { UpdateGroupFormSkeleton } from './-update-form-skeleton';
import { GroupView } from './-view';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useReadGroup } from '@/hooks/tanstack-query/use-group-read';
import { useUpdateGroup } from '@/hooks/tanstack-query/use-group-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import type { IGroup, IHTTPExeptionError, Paginated } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/groups/$groupId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { groupId } = useParams({
    from: '/_private/groups/$groupId/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const _read = useReadGroup({ groupId });

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

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
                to: '/groups',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Detalhes do grupo</h1>
        </div>
        {_read.status === 'success' && mode === 'show' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMode('edit')}
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            <span>Editar</span>
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {_read.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados do grupo"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateGroupFormSkeleton />}
        {_read.status === 'success' && (
          <GroupUpdateContent
            data={_read.data}
            mode={mode}
            setMode={setMode}
          />
        )}
      </div>
    </div>
  );
}

interface GroupUpdateContentProps {
  data: IGroup;
  mode: 'show' | 'edit';
  setMode: React.Dispatch<React.SetStateAction<'show' | 'edit'>>;
}

function GroupUpdateContent({
  data,
  mode,
  setMode,
}: GroupUpdateContentProps): React.JSX.Element {
  const { queryClient } = getContext();

  function setFieldError(
    field: 'name' | 'description' | 'permissions',
    message: string,
  ): void {
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      isTouched: true,
      errors: [{ message }],
      errorMap: { onSubmit: { message } },
    }));
  }

  const _update = useUpdateGroup({
    onSuccess(updatedData) {
      queryClient.setQueryData<IGroup>(
        ['/user-group/'.concat(updatedData._id), updatedData._id],
        updatedData,
      );
      queryClient.setQueryData<Paginated<IGroup>>(
        ['/user-group/paginated', { page: 1, perPage: 50 }],
        (cached) => {
          if (!cached) {
            return {
              meta: MetaDefault,
              data: [updatedData],
            };
          }

          return {
            meta: cached.meta,
            data: cached.data.map((item) => {
              if (item._id === updatedData._id)
                return {
                  ...item,
                  ...updatedData,
                };

              return item;
            }),
          };
        },
      );

      toast('Grupo atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'Os dados do grupo foram atualizados com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as IHTTPExeptionError<{
          name?: string;
          description?: string;
          permissions?: string;
        }>;

        // 404 - Grupo não encontrado (USER_GROUP_NOT_FOUND)
        if (
          errorData.cause === 'USER_GROUP_NOT_FOUND' &&
          errorData.code === 404
        ) {
          toast('Grupo não encontrado', {
            className: '!bg-destructive !text-white !border-destructive',
            description: 'O grupo que você está tentando atualizar não existe',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 400 - Erros de validação (INVALID_PAYLOAD_FORMAT)
        if (
          errorData.cause === 'INVALID_PAYLOAD_FORMAT' &&
          errorData.code === 400
        ) {
          if (errorData.errors['name'])
            setFieldError('name', errorData.errors['name']);
          if (errorData.errors['description'])
            setFieldError('description', errorData.errors['description']);
          if (errorData.errors['permissions'])
            setFieldError('permissions', errorData.errors['permissions']);
          return;
        }

        // 500 - Erro interno (UPDATE_USER_GROUP_ERROR)
        if (
          errorData.cause === 'UPDATE_USER_GROUP_ERROR' &&
          errorData.code === 500
        ) {
          toast('Erro ao atualizar o grupo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'Houve um erro ao atualizar o grupo. Tente novamente mais tarde.',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }
      }

      toast('Erro ao atualizar o grupo', {
        className: '!bg-destructive !text-white !border-destructive',
        description:
          'Houve um erro interno ao atualizar o grupo. Tente novamente mais tarde.',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: data.name,
      description: data.description ?? '',
      permissions: data.permissions.map((p) => p._id),
    } satisfies GroupUpdateFormValues,
    onSubmit: async ({ value }) => {
      const validation = GroupUpdateSchema.safeParse(value);
      if (!validation.success) return;

      if (_update.status === 'pending') return;

      await _update.mutateAsync({
        ...value,
        _id: data._id,
        description: value.description || null,
      });
    },
  });

  const isPending = _update.status === 'pending';

  return (
    <>
      {mode === 'show' && <GroupView data={data} />}

      {mode === 'edit' && (
        <form
          className="flex-1 flex flex-col min-h-0 overflow-auto"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <UpdateGroupFormFields
            form={form}
            isPending={isPending}
            mode={mode}
            slug={data.slug}
          />
        </form>
      )}

      {/* Footer */}
      {mode === 'edit' && (
        <div className="shrink-0 border-t bg-sidebar p-2">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                  onClick={() => {
                    form.reset();
                    setMode('show');
                  }}
                >
                  <span>Cancelar</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="disabled:cursor-not-allowed"
                  disabled={!canSubmit}
                  onClick={() => form.handleSubmit()}
                >
                  {isSubmitting && <Spinner />}
                  <span>Salvar</span>
                </Button>
              </div>
            )}
          />
        </div>
      )}
    </>
  );
}
