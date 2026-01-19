import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon, PencilIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import type { UserUpdateFormValues } from './-update-form';
import { UpdateUserFormFields, UserUpdateSchema } from './-update-form';
import { UpdateUserFormSkeleton } from './-update-form-skeleton';
import { UserView } from './-view';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useReadUser } from '@/hooks/tanstack-query/use-user-read';
import { useUpdateUser } from '@/hooks/tanstack-query/use-user-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import type { IHTTPExeptionError, IUser, Paginated } from '@/lib/interfaces';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/users/$userId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { userId } = useParams({
    from: '/_private/users/$userId/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const _read = useReadUser({ userId });

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
                to: '/users',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Detalhes do usuário</h1>
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
            message="Houve um erro ao buscar dados do usuário"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateUserFormSkeleton />}
        {_read.status === 'success' && (
          <UserUpdateContent
            data={_read.data}
            mode={mode}
            setMode={setMode}
          />
        )}
      </div>
    </div>
  );
}

interface UserUpdateContentProps {
  data: IUser;
  mode: 'show' | 'edit';
  setMode: React.Dispatch<React.SetStateAction<'show' | 'edit'>>;
}

function UserUpdateContent({
  data,
  mode,
  setMode,
}: UserUpdateContentProps): React.JSX.Element {
  const authentication = useAuthenticationStore();

  const { queryClient } = getContext();

  const form = useAppForm({
    defaultValues: {
      name: data.name,
      email: data.email,
      password: '',
      status: data.status,
      group: data.group._id,
    } satisfies UserUpdateFormValues,
    validators: {
      onSubmit: UserUpdateSchema,
    },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;
      await _update.mutateAsync({
        ...value,
        _id: data._id,
        ...(value.password !== '' && { password: value.password }),
      });
    },
  });

  function setFieldError(
    field: 'name' | 'email' | 'password' | 'status' | 'group',
    message: string,
  ): void {
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      isTouched: true,
      errors: [{ message }],
      errorMap: { onSubmit: { message } },
    }));
  }

  const _update = useUpdateUser({
    onSuccess(updatedData) {
      queryClient.setQueryData<IUser>(
        ['/users/'.concat(updatedData._id), updatedData._id],
        updatedData,
      );
      queryClient.setQueryData<Paginated<IUser>>(
        [
          '/users/paginated',
          {
            page: 1,
            perPage: 50,
            authenticated: authentication.authenticated?.sub,
          },
        ],
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

      toast('Usuário atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'Os dados do usuário foram atualizados com sucesso',
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
          email?: string;
          password?: string;
          status?: string;
          group?: string;
        }>;

        // 404 - Usuário não encontrado
        if (errorData.cause === 'USER_NOT_FOUND' && errorData.code === 404) {
          toast('Usuário não encontrado', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'O usuário que você está tentando atualizar não existe',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 400 - Erros de validação
        if (
          errorData.cause === 'INVALID_PAYLOAD_FORMAT' &&
          errorData.code === 400
        ) {
          if (errorData.errors['name'])
            setFieldError('name', errorData.errors['name']);

          if (errorData.errors['email'])
            setFieldError('email', errorData.errors['email']);

          if (errorData.errors['password'])
            setFieldError('password', errorData.errors['password']);

          if (errorData.errors['group'])
            setFieldError('group', errorData.errors['group']);

          return;
        }

        if (errorData.cause === 'UPDATE_USER_ERROR' && errorData.code === 500) {
          toast('Erro ao atualizar o usuário', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'Houve um erro ao atualizar o usuário. Tente novamente mais tarde.',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        toast('Erro ao atualizar o usuário', {
          className: '!bg-destructive !text-white !border-destructive',
          description:
            'Houve um erro interno ao atualizar o usuário. Tente novamente mais tarde.',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
    },
  });

  const isPending = _update.status === 'pending';

  return (
    <>
      {mode === 'show' && <UserView data={data} />}

      {mode === 'edit' && (
        <form
          className="flex-1 flex flex-col min-h-0 overflow-auto"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <UpdateUserFormFields
            form={form}
            isPending={isPending}
            mode={mode}
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
