import { createFileRoute } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import React from 'react';
import { toast } from 'sonner';

import { SettingUpdateSchema, UpdateSettingFormFields } from './-update-form';
import { UpdateSettingFormSkeleton } from './-update-form-skeleton';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useSettingRead } from '@/hooks/tanstack-query/use-setting-read';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { useUpdateSetting } from '@/hooks/tanstack-query/use-setting-update';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import type { ISetting } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/settings/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const _read = useSettingRead();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <h1 className="text-xl font-medium">Configurações do Sistema</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {_read.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar configurações do sistema"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateSettingFormSkeleton />}
        {_read.status === 'success' && (
          <SettingUpdateContent data={_read.data} />
        )}
      </div>
    </div>
  );
}

function SettingUpdateContent({ data }: { data: ISetting }): React.JSX.Element {
  const { queryClient } = getContext();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const _update = useUpdateSetting({
    onSuccess(updatedData) {
      queryClient.setQueryData<ISetting>(['/setting'], updatedData);

      toast('Configurações atualizadas', {
        className: '!bg-green-600 !text-white !border-green-600',
        description:
          'As configurações do sistema foram atualizadas com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;

        toast('Erro ao atualizar configurações', {
          className: '!bg-destructive !text-white !border-destructive',
          description:
            errorData?.message ?? 'Erro ao atualizar as configurações',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues: {
      LOCALE: data.LOCALE,
      LOGO_SMALL_URL: data.LOGO_SMALL_URL,
      LOGO_LARGE_URL: data.LOGO_LARGE_URL,
      FILE_UPLOAD_MAX_SIZE: String(data.FILE_UPLOAD_MAX_SIZE),
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: String(
        data.FILE_UPLOAD_MAX_FILES_PER_UPLOAD,
      ),
      FILE_UPLOAD_ACCEPTED: data.FILE_UPLOAD_ACCEPTED.join(';'),
      PAGINATION_PER_PAGE: String(data.PAGINATION_PER_PAGE),
      EMAIL_PROVIDER_HOST: data.EMAIL_PROVIDER_HOST,
      EMAIL_PROVIDER_PORT: String(data.EMAIL_PROVIDER_PORT),
      EMAIL_PROVIDER_USER: data.EMAIL_PROVIDER_USER,
      EMAIL_PROVIDER_PASSWORD: data.EMAIL_PROVIDER_PASSWORD,
      logoSmallFile: [] as Array<File>,
      logoLargeFile: [] as Array<File>,
    },
    onSubmit: async ({ value }) => {
      const validation = SettingUpdateSchema.safeParse(value);
      if (!validation.success) return;

      if (_update.status === 'pending') return;

      const payload = {
        LOCALE: value.LOCALE.trim(),
        LOGO_SMALL_URL: value.LOGO_SMALL_URL,
        LOGO_LARGE_URL: value.LOGO_LARGE_URL,
        FILE_UPLOAD_MAX_SIZE: Number(value.FILE_UPLOAD_MAX_SIZE),
        FILE_UPLOAD_MAX_FILES_PER_UPLOAD: Number(
          value.FILE_UPLOAD_MAX_FILES_PER_UPLOAD,
        ),
        FILE_UPLOAD_ACCEPTED: value.FILE_UPLOAD_ACCEPTED.split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(';'),
        PAGINATION_PER_PAGE: Number(value.PAGINATION_PER_PAGE),
        EMAIL_PROVIDER_HOST: value.EMAIL_PROVIDER_HOST.trim(),
        EMAIL_PROVIDER_PORT: Number(value.EMAIL_PROVIDER_PORT),
        EMAIL_PROVIDER_USER: value.EMAIL_PROVIDER_USER.trim(),
        EMAIL_PROVIDER_PASSWORD: value.EMAIL_PROVIDER_PASSWORD.trim(),
      };

      await _update.mutateAsync(payload);
    },
  });

  const isPending = _update.status === 'pending';

  return (
    <>
      <form
        className="flex-1 flex flex-col min-h-0 overflow-auto"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <UpdateSettingFormFields
          form={form}
          isPending={isPending}
          mode={mode}
          settingData={data}
        />
      </form>

      {/* Footer com botões */}
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
    </>
  );
}
