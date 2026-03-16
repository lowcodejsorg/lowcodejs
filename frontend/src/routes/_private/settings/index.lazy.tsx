import { useSuspenseQuery } from '@tanstack/react-query';
import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { PencilIcon } from 'lucide-react';
import React from 'react';

import { SettingUpdateSchema, UpdateSettingFormFields } from './-update-form';
import { SettingView } from './-view';

import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/uploading-context';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { settingOptions } from '@/hooks/tanstack-query/_query-options';
import { useUpdateSetting } from '@/hooks/tanstack-query/use-setting-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import type { ISetting } from '@/lib/interfaces';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_private/settings/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { data } = useSuspenseQuery(settingOptions());

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <h1 className="text-xl font-medium">Configurações do Sistema</h1>
        </div>
        {mode === 'show' && (
          <Button
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
        <UploadingProvider>
          <SettingUpdateContent
            data={data}
            mode={mode}
            setMode={setMode}
          />
        </UploadingProvider>
      </div>
    </div>
  );
}

interface SettingUpdateContentProps {
  data: ISetting;
  mode: 'show' | 'edit';
  setMode: React.Dispatch<React.SetStateAction<'show' | 'edit'>>;
}

function SettingUpdateContent({
  data,
  mode,
  setMode,
}: SettingUpdateContentProps): React.JSX.Element {
  const router = useRouter();
  const isUploading = useIsUploading();

  const goBack = (): void => {
    router.navigate({
      to: '/',
      replace: true,
    });
  };

  const _update = useUpdateSetting({
    onSuccess() {
      toastSuccess(
        'Configurações atualizadas',
        'As configurações do sistema foram atualizadas com sucesso',
      );

      form.reset();
      setMode('show');
      router.invalidate();
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao atualizar configurações',
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
      SYSTEM_NAME: data.SYSTEM_NAME || 'LowCodeJs',
      LOCALE: data.LOCALE,
      LOGO_SMALL_URL: data.LOGO_SMALL_URL,
      LOGO_LARGE_URL: data.LOGO_LARGE_URL,
      FILE_UPLOAD_MAX_SIZE: String(data.FILE_UPLOAD_MAX_SIZE),
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: String(
        data.FILE_UPLOAD_MAX_FILES_PER_UPLOAD,
      ),
      FILE_UPLOAD_ACCEPTED: data.FILE_UPLOAD_ACCEPTED.join(';'),
      PAGINATION_PER_PAGE: String(data.PAGINATION_PER_PAGE),
      MODEL_CLONE_TABLES: data.MODEL_CLONE_TABLES.flatMap((t) => t._id),
      EMAIL_PROVIDER_HOST: data.EMAIL_PROVIDER_HOST,
      EMAIL_PROVIDER_PORT: String(data.EMAIL_PROVIDER_PORT),
      EMAIL_PROVIDER_USER: data.EMAIL_PROVIDER_USER,
      EMAIL_PROVIDER_PASSWORD: data.EMAIL_PROVIDER_PASSWORD,
      logoSmallFile: [] as Array<File>,
      logoLargeFile: [] as Array<File>,
    },
    validators: {
      onChange: SettingUpdateSchema,
      onSubmit: SettingUpdateSchema,
    },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      const payload = {
        SYSTEM_NAME: value.SYSTEM_NAME.trim(),
        LOCALE: value.LOCALE.trim(),
        LOGO_SMALL_URL: value.LOGO_SMALL_URL ?? undefined,
        LOGO_LARGE_URL: value.LOGO_LARGE_URL ?? undefined,
        FILE_UPLOAD_MAX_SIZE: Number(value.FILE_UPLOAD_MAX_SIZE),
        FILE_UPLOAD_MAX_FILES_PER_UPLOAD: Number(
          value.FILE_UPLOAD_MAX_FILES_PER_UPLOAD,
        ),
        FILE_UPLOAD_ACCEPTED: value.FILE_UPLOAD_ACCEPTED.split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(';'),
        PAGINATION_PER_PAGE: Number(value.PAGINATION_PER_PAGE),
        MODEL_CLONE_TABLES: value.MODEL_CLONE_TABLES,
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
      {mode === 'show' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <SettingView data={data} />
        </div>
      )}

      {mode === 'edit' && (
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
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                  disabled={!canSubmit || isUploading}
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
