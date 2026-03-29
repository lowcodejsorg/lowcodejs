import { useSuspenseQuery } from '@tanstack/react-query';
import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { PencilIcon } from 'lucide-react';
import React from 'react';

import type { ProfileUpdateFormValues } from './-update-form';
import { ProfileUpdateSchema, UpdateProfileFormFields } from './-update-form';
import { ProfileView } from './-view';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { profileDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { useUpdateProfile } from '@/hooks/tanstack-query/use-profile-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import type { IUser } from '@/lib/interfaces';
import { toastError, toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_private/profile/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { data } = useSuspenseQuery(profileDetailOptions());

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      data-test-id="profile-page"
    >
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <h1 className="text-xl font-medium">Perfil do usuário</h1>
        </div>
        {mode === 'show' && (
          <Button
            type="button"
            className="px-2 cursor-pointer max-w-40 w-full"
            size="sm"
            onClick={() => setMode('edit')}
            data-test-id="profile-edit-btn"
          >
            <PencilIcon className="size-4 mr-1" />
            <span>Editar</span>
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <ProfileUpdateContent
          data={data}
          mode={mode}
          setMode={setMode}
        />
      </div>
    </div>
  );
}

interface ProfileUpdateContentProps {
  data: IUser;
  mode: 'show' | 'edit';
  setMode: React.Dispatch<React.SetStateAction<'show' | 'edit'>>;
}

function ProfileUpdateContent({
  data,
  mode,
  setMode,
}: ProfileUpdateContentProps): React.JSX.Element {
  const router = useRouter();

  const goBack = (): void => {
    router.navigate({
      to: '/',
      replace: true,
    });
  };

  const [allowPasswordChange, setAllowPasswordChange] = React.useState(false);

  const _update = useUpdateProfile({
    onSuccess() {
      toastSuccess(
        'Perfil atualizado',
        'Os dados do perfil foram atualizados com sucesso',
      );

      form.reset();
      setMode('show');
      setAllowPasswordChange(false);
      router.invalidate();
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao atualizar o perfil',
        onFieldErrors: (errors) => {
          const setFieldError = createFieldErrorSetter(form);
          for (const [field, msg] of Object.entries(errors)) {
            setFieldError(field, msg);
          }
        },
      });
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: data.name,
      email: data.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    } satisfies ProfileUpdateFormValues,
    validators: {
      onChange: ProfileUpdateSchema,
      onSubmit: ProfileUpdateSchema,
    },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      if (allowPasswordChange && value.newPassword !== value.confirmPassword) {
        toastError(
          'As senhas não coincidem',
          'A nova senha e a confirmação devem ser iguais',
        );
        return;
      }

      const payload: {
        name: string;
        email: string;
        allowPasswordChange: boolean;
        currentPassword?: string;
        newPassword?: string;
      } = {
        name: value.name.trim(),
        email: value.email.trim(),
        allowPasswordChange,
      };

      if (allowPasswordChange) {
        payload.currentPassword = value.currentPassword.trim();
        payload.newPassword = value.newPassword.trim();
      }

      await _update.mutateAsync(payload);
    },
  });

  const isPending = _update.status === 'pending';

  return (
    <>
      {mode === 'show' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <ProfileView data={data} />
        </div>
      )}

      {/* Footer - Show Mode */}
      {mode === 'show' && (
        <div className="shrink-0 border-t bg-sidebar p-2">
          <div className="flex justify-end gap-2">
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
          className="flex-1 flex flex-col min-h-0 overflow-auto"
          data-test-id="profile-update-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <UpdateProfileFormFields
            form={form}
            isPending={isPending}
            mode={mode}
            allowPasswordChange={allowPasswordChange}
            onAllowPasswordChangeChange={setAllowPasswordChange}
            groupData={data.group}
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
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                  disabled={isSubmitting}
                  data-test-id="profile-update-cancel-btn"
                  onClick={() => {
                    form.reset();
                    setMode('show');
                    setAllowPasswordChange(false);
                  }}
                >
                  <span>Cancelar</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                  disabled={!canSubmit}
                  data-test-id="profile-update-submit-btn"
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
