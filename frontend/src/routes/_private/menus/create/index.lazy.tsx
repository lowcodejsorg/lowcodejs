import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';

import {
  CreateMenuFormFields,
  MenuCreateSchema,
  menuFormDefaultValues,
} from './-create-form';

import { FormFooter } from '@/components/common/form-footer';
import { PageHeader, PageShell } from '@/components/common/page-shell';
import { useSidebar } from '@/components/ui/sidebar';
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

  const goBack = (): void => {
    sidebar.setOpen(true);
    router.navigate({
      to: '/menus',
      replace: true,
      search: { page: 1, perPage: 50 },
    });
  };

  return (
    <PageShell data-test-id="create-menu-page">
      <PageShell.Header>
        <PageHeader
          onBack={goBack}
          title="Criar novo menu"
        />
      </PageShell.Header>

      <PageShell.Content>
        <form
          data-test-id="create-menu-form"
          className="flex-1 flex flex-col min-h-0 overflow-auto"
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
      </PageShell.Content>

      <PageShell.Footer>
        <FormFooter
          form={form}
          onCancel={() =>
            navigate({ to: '/menus', search: { page: 1, perPage: 50 } })
          }
          submitLabel="Criar"
        />
      </PageShell.Footer>
    </PageShell>
  );
}
