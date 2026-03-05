import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import { ArrowLeftIcon, PencilIcon } from 'lucide-react';
import React from 'react';

import type { GroupUpdateFormValues } from './-update-form';
import { GroupUpdateSchema, UpdateGroupFormFields } from './-update-form';
import { GroupView } from './-view';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { groupDetailOptions } from '@/hooks/tanstack-query/_query-options';
import { useUpdateGroup } from '@/hooks/tanstack-query/use-group-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import type { IGroup } from '@/lib/interfaces';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_private/groups/$groupId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { groupId } = useParams({
    from: '/_private/groups/$groupId/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const { data } = useSuspenseQuery(groupDetailOptions(groupId));

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
        <GroupUpdateContent
          data={data}
          mode={mode}
          setMode={setMode}
        />
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
  const sidebar = useSidebar();
  const router = useRouter();

  const goBack = (): void => {
    sidebar.setOpen(true);
    router.navigate({
      to: '/groups',
      replace: true,
      search: { page: 1, perPage: 50 },
    });
  };

  const _update = useUpdateGroup({
    onSuccess() {
      toastSuccess(
        'Grupo atualizado',
        'Os dados do grupo foram atualizados com sucesso',
      );

      form.reset();
      setMode('show');
      router.invalidate();
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao atualizar o grupo',
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
      {mode === 'show' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <GroupView data={data} />
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
