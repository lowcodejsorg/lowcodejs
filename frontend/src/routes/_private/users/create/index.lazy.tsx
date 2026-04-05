import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import {
  CreateUserFormFields,
  UserCreateSchema,
  userFormDefaultValues,
} from './-create-form';

import { FormFooter } from '@/components/common/form-footer';
import { PageHeader, PageShell } from '@/components/common/page-shell';
import { useSidebar } from '@/components/ui/sidebar';
import { useCreateUser } from '@/hooks/tanstack-query/use-user-create';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_private/users/create/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();

  const form = useAppForm({
    defaultValues: userFormDefaultValues,
    validators: {
      onChange: UserCreateSchema,
      onSubmit: UserCreateSchema,
    },
    onSubmit: async ({ value }) => {
      if (_create.status === 'pending') return;
      await _create.mutateAsync(value);
    },
  });

  const setFieldError = createFieldErrorSetter(form);

  const _create = useCreateUser({
    onSuccess() {
      toastSuccess('Usuário criado', 'O usuário foi criado com sucesso');

      form.reset();
      navigate({ to: '/users', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
      router.invalidate();
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao criar o usuário',
        onFieldErrors: (errors) => {
          for (const [field, msg] of Object.entries(errors)) {
            setFieldError(field, msg);
          }
        },
      });
    },
  });

  const isPending = _create.status === 'pending';

  const goBack = (): void => {
    sidebar.setOpen(true);
    router.navigate({
      to: '/users',
      replace: true,
      search: { page: 1, perPage: 50 },
    });
  };

  return (
    <PageShell data-test-id="create-user-page">
      <PageShell.Header>
        <PageHeader onBack={goBack} title="Criar novo usuário" />
      </PageShell.Header>

      <PageShell.Content>
        <form
          data-test-id="create-user-form"
          className="flex-1 flex flex-col min-h-0 overflow-auto"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <CreateUserFormFields
            form={form}
            isPending={isPending}
          />
        </form>
      </PageShell.Content>

      <PageShell.Footer>
        <FormFooter
          form={form}
          onCancel={() => navigate({ to: '/users', search: { page: 1, perPage: 50 } })}
          submitLabel="Criar"
        />
      </PageShell.Footer>
    </PageShell>
  );
}
