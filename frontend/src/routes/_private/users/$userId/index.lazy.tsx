import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import { ArrowLeftIcon, PencilIcon } from 'lucide-react';
import React from 'react';

import type { UserUpdateFormValues } from './-update-form';
import { UpdateUserFormFields, UserUpdateSchema } from './-update-form';
import { UserView } from './-view';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { userDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { useUpdateUser } from '@/hooks/tanstack-query/use-user-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import type { IUser } from '@/lib/interfaces';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_private/users/$userId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { userId } = useParams({
    from: '/_private/users/$userId/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const { data } = useSuspenseQuery(userDetailOptions(userId));

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      data-test-id="user-detail-page"
    >
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
        {mode === 'show' && (
          <Button
            data-test-id="user-edit-btn"
            type="button"
            className="px-2 cursor-pointer max-w-40 w-full"
            size="sm"
            onClick={() => setMode('edit')}
          >
            <PencilIcon className="size-4 mr-1" />
            <span>Editar</span>
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <UserUpdateContent
          data={data}
          mode={mode}
          setMode={setMode}
        />
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
  const sidebar = useSidebar();
  const router = useRouter();

  const [allowPasswordChange, setAllowPasswordChange] = React.useState(false);

  const goBack = (): void => {
    sidebar.setOpen(true);
    router.navigate({
      to: '/users',
      replace: true,
      search: { page: 1, perPage: 50 },
    });
  };

  const form = useAppForm({
    defaultValues: {
      name: data.name,
      email: data.email,
      password: '',
      status: data.status,
      group: data.group._id,
    } satisfies UserUpdateFormValues,
    validators: {
      onChange: UserUpdateSchema,
      onSubmit: UserUpdateSchema,
    },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      const { password, ...rest } = value;
      await _update.mutateAsync({
        ...rest,
        _id: data._id,
        ...(allowPasswordChange && password !== '' && { password }),
      });
    },
  });

  const setFieldError = createFieldErrorSetter(form);

  const _update = useUpdateUser({
    onSuccess() {
      toastSuccess(
        'Usuário atualizado',
        'Os dados do usuário foram atualizados com sucesso',
      );

      form.reset();
      setMode('show');
      setAllowPasswordChange(false);
      router.invalidate();
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao atualizar o usuário',
        onFieldErrors: (errors) => {
          for (const [field, msg] of Object.entries(errors)) {
            setFieldError(field, msg);
          }
        },
      });
    },
  });

  const isPending = _update.status === 'pending';

  return (
    <>
      {mode === 'show' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <UserView data={data} />
        </div>
      )}

      {/* Footer - Show Mode */}
      {mode === 'show' && (
        <div className="shrink-0 border-t bg-sidebar p-2">
          <div className="flex justify-start gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="px-2 cursor-pointer max-w-40 w-full"
              onClick={goBack}
            >
              <span>Voltar</span>
            </Button>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <form
          data-test-id="user-update-form"
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
            allowPasswordChange={allowPasswordChange}
            onAllowPasswordChangeChange={setAllowPasswordChange}
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
                  data-test-id="user-update-cancel-btn"
                  type="button"
                  variant="outline"
                  size="sm"
                  className="disabled:cursor-not-allowed px-2 cursor-pointer"
                  disabled={isSubmitting}
                  onClick={() => {
                    form.reset();
                    setMode('show');
                    setAllowPasswordChange(false);
                  }}
                >
                  <span>Cancelar</span>
                </Button>
                <Button
                  data-test-id="user-update-submit-btn"
                  type="button"
                  size="sm"
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
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
