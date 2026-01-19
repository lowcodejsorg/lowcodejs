import { createFileRoute } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { PencilIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { ProfileUpdateSchema, UpdateProfileFormFields } from './-update-form';
import type { ProfileUpdateFormValues } from './-update-form';
import { UpdateProfileFormSkeleton } from './-update-form-skeleton';
import { ProfileView } from './-view';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useProfileRead } from '@/hooks/tanstack-query/use-profile-read';
import { useUpdateProfile } from '@/hooks/tanstack-query/use-profile-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import type { IUser } from '@/lib/interfaces';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/profile/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const _read = useProfileRead();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <h1 className="text-xl font-medium">Perfil do usuário</h1>
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
            message="Houve um erro ao buscar dados do perfil"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateProfileFormSkeleton />}
        {_read.status === 'success' && (
          <ProfileUpdateContent
            data={_read.data}
            mode={mode}
            setMode={setMode}
          />
        )}
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
  const { queryClient } = getContext();
  const authentication = useAuthenticationStore();

  const [allowPasswordChange, setAllowPasswordChange] = React.useState(false);

  const _update = useUpdateProfile({
    onSuccess(updatedData) {
      queryClient.setQueryData<IUser>(
        ['/profile', authentication.authenticated?.sub],
        updatedData,
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
        const errorData = error.response?.data;

        toast('Erro ao atualizar o perfil', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao atualizar o perfil',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
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
        payload.currentPassword = value.currentPassword.trim();
        payload.newPassword = value.newPassword.trim();
      }

      await _update.mutateAsync(payload);
    },
  });

  const isPending = _update.status === 'pending';

  return (
    <>
      {mode === 'show' && <ProfileView data={data} />}

      {mode === 'edit' && (
        <form
          className="flex-1 flex flex-col min-h-0 overflow-auto"
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
                  className="disabled:cursor-not-allowed"
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
