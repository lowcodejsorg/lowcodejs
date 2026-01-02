import { createFileRoute } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import React from 'react';
import { toast } from 'sonner';

import {
  ProfileUpdateSchema,
  UpdateProfileFormFields,
  profileUpdateFormDefaultValues,
} from './-update-form';
import { UpdateProfileFormSkeleton } from './-update-form-skeleton';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useProfile } from '@/hooks/use-profile';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { useUpdateProfile } from '@/integrations/tanstack-query/implementations/use-profile-update';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import type { IUser } from '@/lib/interfaces';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/profile/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { queryClient } = getContext();

  const authentication = useAuthenticationStore();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');
  const [allowPasswordChange, setAllowPasswordChange] = React.useState(false);

  const _read = useProfile();

  const _update = useUpdateProfile({
    onSuccess(data) {
      queryClient.setQueryData<IUser>(
        ['/profile', authentication.authenticated?.sub],
        data,
      );

      toast('Perfil atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'Os dados do perfil foram atualizados com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
      setAllowPasswordChange(false);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        toast('Erro ao atualizar o perfil', {
          className: '!bg-destructive !text-white !border-destructive',
          description: data?.message ?? 'Erro ao atualizar o perfil',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues: _read.data
      ? {
          name: _read.data.name,
          email: _read.data.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }
      : profileUpdateFormDefaultValues,
    onSubmit: async ({ value }) => {
      const validation = ProfileUpdateSchema.safeParse(value);
      if (!validation.success) return;

      if (_update.status === 'pending') return;

      if (allowPasswordChange && value.newPassword !== value.confirmPassword) {
        toast('As senhas não coincidem', {
          className: '!bg-destructive !text-white !border-destructive',
          description: 'A nova senha e a confirmação devem ser iguais',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
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
        payload.currentPassword = value.currentPassword?.trim();
        payload.newPassword = value.newPassword?.trim();
      }

      await _update.mutateAsync(payload);
    },
  });

  const isPending = _update.status === 'pending';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <h1 className="text-xl font-medium">Perfil do usuário</h1>
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
        {_read.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados do perfil"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateProfileFormSkeleton />}
        {_read.status === 'success' && (
          <UpdateProfileFormFields
            form={form}
            isPending={isPending}
            mode={mode}
            allowPasswordChange={allowPasswordChange}
            onAllowPasswordChangeChange={setAllowPasswordChange}
            groupData={_read.data.group}
          />
        )}
      </form>

      {/* Footer com botões */}
      {_read.status === 'success' && (
        <div className="shrink-0 border-t p-2">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <div className="flex justify-end space-x-2">
                {mode === 'show' && (
                  <Button
                    type="button"
                    className="w-full max-w-3xs"
                    onClick={() => setMode('edit')}
                  >
                    <span>Editar</span>
                  </Button>
                )}

                {mode === 'edit' && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full max-w-3xs"
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
                      type="button"
                      className="w-full max-w-3xs"
                      disabled={!canSubmit}
                      onClick={() => form.handleSubmit()}
                    >
                      {isSubmitting && <Spinner />}
                      <span>Salvar</span>
                    </Button>
                  </>
                )}
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
