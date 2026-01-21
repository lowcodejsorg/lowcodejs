import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  CreateGroupFormFields,
  GroupCreateSchema,
  groupFormDefaultValues,
} from './-create-form';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useCreateGroup } from '@/hooks/tanstack-query/use-group-create';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import type { IGroup, IHTTPExeptionError, Paginated } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/groups/create/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();

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

  const _create = useCreateGroup({
    onSuccess(data) {
      queryClient.setQueryData<Paginated<IGroup>>(
        ['/user-group/paginated', { page: 1, perPage: 50 }],
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

      toast('Grupo criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O grupo foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      navigate({ to: '/groups', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as IHTTPExeptionError<{
          name?: string;
          description?: string;
          permissions?: string;
        }>;

        // 409 - Grupo já existe (GROUP_EXISTS)
        if (data.cause === 'GROUP_EXISTS' && data.code === 409) {
          setFieldError('name', 'Já existe um grupo com este nome');
          return;
        }

        // 400 - Erros de validação (INVALID_PAYLOAD_FORMAT)
        if (data.cause === 'INVALID_PAYLOAD_FORMAT' && data.code === 400) {
          if (data.errors['name']) setFieldError('name', data.errors['name']);
          if (data.errors['description'])
            setFieldError('description', data.errors['description']);
          if (data.errors['permissions'])
            setFieldError('permissions', data.errors['permissions']);
          return;
        }

        // 500 - Erro interno (CREATE_USER_GROUP_ERROR)
        if (data.cause === 'CREATE_USER_GROUP_ERROR' && data.code === 500) {
          toast('Erro ao criar o grupo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'Houve um erro ao criar o grupo. Tente novamente mais tarde.',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }
      }

      toast('Erro ao criar o grupo', {
        className: '!bg-destructive !text-white !border-destructive',
        description:
          'Houve um erro interno ao criar o grupo. Tente novamente mais tarde.',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues: groupFormDefaultValues,
    validators: {
      onSubmit: GroupCreateSchema,
    },
    onSubmit: async ({ value }) => {
      if (_create.status === 'pending') return;

      await _create.mutateAsync({
        name: value.name,
        description: value.description || null,
        permissions: value.permissions,
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
                to: '/groups',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Criar novo grupo</h1>
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
        <CreateGroupFormFields
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
                  navigate({ to: '/groups', search: { page: 1, perPage: 50 } });
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
