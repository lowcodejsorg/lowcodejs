import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  CreateUserFormFields,
  UserCreateSchema,
  userFormDefaultValues,
} from './-create-form';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useCreateUser } from '@/hooks/tanstack-query/use-user-create';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import type { IHTTPExeptionError, IUser, Paginated } from '@/lib/interfaces';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/users/create/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const authentication = useAuthenticationStore();

  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();

  const form = useAppForm({
    defaultValues: userFormDefaultValues,
    validators: {
      onSubmit: UserCreateSchema,
    },
    onSubmit: async ({ value }) => {
      if (_create.status === 'pending') return;
      await _create.mutateAsync(value);
    },
  });

  function setFieldError(
    field: 'name' | 'email' | 'password' | 'group',
    message: string,
  ): void {
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      isTouched: true,
      errors: [{ message }],
      errorMap: { onSubmit: { message } },
    }));
  }

  const _create = useCreateUser({
    onSuccess(data) {
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

      toast('Usuário criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O usuário foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      navigate({ to: '/users', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as IHTTPExeptionError<{
          name?: string;
          email?: string;
          password?: string;
          group?: string;
        }>;

        // 409 - Email já em uso
        if (data.cause === 'USER_ALREADY_EXISTS' && data.code === 409) {
          setFieldError('email', 'Este email já está em uso');
          return;
        }

        // 400 - Grupo não informado
        if (data.cause === 'GROUP_NOT_INFORMED' && data.code === 400) {
          setFieldError('group', 'Grupo é obrigatório');
          return;
        }

        // 400 - Erros de validação
        if (data.cause === 'INVALID_PAYLOAD_FORMAT' && data.code === 400) {
          if (data.errors['name']) setFieldError('name', data.errors['name']);

          if (data.errors['email'])
            setFieldError('email', data.errors['email']);

          if (data.errors['password'])
            setFieldError('password', data.errors['password']);

          if (data.errors['group'])
            setFieldError('group', data.errors['group']);
          return;
        }

        toast('Erro ao criar o usuário', {
          className: '!bg-destructive !text-white !border-destructive',
          description: 'Erro ao criar o usuário',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
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
                to: '/users',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Criar novo usuário</h1>
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
        <CreateUserFormFields
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
                  navigate({ to: '/users', search: { page: 1, perPage: 50 } });
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
