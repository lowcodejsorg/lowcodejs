import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

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
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_private/groups/create/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();

  const _create = useCreateGroup({
    onSuccess() {
      toastSuccess('Grupo criado', 'O grupo foi criado com sucesso');

      form.reset();
      navigate({ to: '/groups', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
      router.invalidate();
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao criar o grupo',
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
    defaultValues: groupFormDefaultValues,
    validators: {
      // @ts-expect-error Zod Standard Schema type inference
      onChange: GroupCreateSchema,
      // @ts-expect-error Zod Standard Schema type inference
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
    <div
      className="flex flex-col h-full overflow-hidden"
      data-test-id="create-group-page"
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
        data-test-id="create-group-form"
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
                data-test-id="create-group-cancel-btn"
                type="button"
                variant="outline"
                className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                disabled={isSubmitting}
                onClick={() => {
                  navigate({ to: '/groups', search: { page: 1, perPage: 50 } });
                }}
              >
                <span>Cancelar</span>
              </Button>
              <Button
                data-test-id="create-group-submit-btn"
                type="button"
                className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
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
