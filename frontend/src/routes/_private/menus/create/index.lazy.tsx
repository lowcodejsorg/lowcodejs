import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { ArrowLeftIcon } from 'lucide-react';

import {
  CreateMenuFormFields,
  MenuCreateSchema,
  menuFormDefaultValues,
} from './-create-form';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useCreateMenu } from '@/hooks/tanstack-query/use-menu-create';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import type { E_MENU_ITEM_TYPE } from '@/lib/constant';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import type { ValueOf } from '@/lib/interfaces';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_private/menus/create/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();

  const _create = useCreateMenu({
    onSuccess() {
      toastSuccess('Menu criado', 'O menu foi criado com sucesso');

      form.reset();
      navigate({ to: '/menus', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
      router.invalidate();
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao criar o menu',
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
    defaultValues: menuFormDefaultValues,
    validators: { onChange: MenuCreateSchema, onSubmit: MenuCreateSchema },
    onSubmit: async ({ value }) => {
      if (_create.status === 'pending') return;

      await _create.mutateAsync({
        name: value.name,
        type: value.type,
        parent: value.parent || null,
        table: value.table || null,
        html: value.html || null,
        url: value.url || null,
      });
    },
  });

  const isPending = _create.status === 'pending';
  const menuType = useStore(form.store, (state) => state.values.type) as
    | ValueOf<typeof E_MENU_ITEM_TYPE>
    | '';

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
                to: '/menus',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Criar novo menu</h1>
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
        <CreateMenuFormFields
          form={form}
          isPending={isPending}
          menuType={menuType}
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
                className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                disabled={isSubmitting}
                onClick={() => {
                  navigate({ to: '/menus', search: { page: 1, perPage: 50 } });
                }}
              >
                <span>Cancelar</span>
              </Button>
              <Button
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
