import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';

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
import { getContext } from '@/integrations/tanstack-query/root-provider';
import type { E_MENU_ITEM_TYPE } from '@/lib/constant';
import { MetaDefault } from '@/lib/constant';
import type {
  IHTTPExeptionError,
  IMenu,
  Paginated,
  ValueOf,
} from '@/lib/interfaces';

export const Route = createFileRoute('/_private/menus/create/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();

  function setFieldError(
    field: 'name' | 'type' | 'table' | 'parent' | 'html' | 'url',
    message: string,
  ): void {
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      isTouched: true,
      errors: [{ message }],
      errorMap: { onSubmit: { message } },
    }));
  }

  const _create = useCreateMenu({
    onSuccess(data) {
      queryClient.setQueryData<Paginated<IMenu>>(
        ['/menu/paginated', { page: 1, perPage: 50 }],
        (cached) => {
          if (!cached) {
            return {
              meta: MetaDefault,
              data: [data],
            };
          }

          return {
            meta: {
              ...cached.meta,
              total: cached.meta.total + 1,
            },
            data: [data, ...cached.data],
          };
        },
      );

      toast('Menu criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O menu foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      navigate({ to: '/menus', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as IHTTPExeptionError<{
          name?: string;
          type?: string;
          table?: string;
          parent?: string;
          html?: string;
          url?: string;
        }>;

        // 404 - Menu pai não encontrado
        if (data.cause === 'PARENT_MENU_NOT_FOUND' && data.code === 404) {
          setFieldError('parent', 'Menu pai não encontrado');
          return;
        }

        // 409 - Menu já existe
        if (data.cause === 'MENU_ALREADY_EXISTS' && data.code === 409) {
          setFieldError('name', 'Já existe um menu com este nome');
          return;
        }

        // 404 - Tabela não encontrada
        if (data.cause === 'TABLE_NOT_FOUND' && data.code === 404) {
          setFieldError('table', 'Tabela não encontrada');
          return;
        }

        // 400 - Parâmetros inválidos
        if (data.cause === 'INVALID_PARAMETERS' && data.code === 400) {
          setFieldError('table', 'Tabela é obrigatória para este tipo de menu');
          return;
        }

        // 400 - Erros de validação
        if (data.cause === 'INVALID_PAYLOAD_FORMAT' && data.code === 400) {
          if (data.errors['name']) setFieldError('name', data.errors['name']);
          if (data.errors['type']) setFieldError('type', data.errors['type']);
          if (data.errors['table'])
            setFieldError('table', data.errors['table']);
          if (data.errors['parent'])
            setFieldError('parent', data.errors['parent']);
          if (data.errors['html']) setFieldError('html', data.errors['html']);
          if (data.errors['url']) setFieldError('url', data.errors['url']);
          return;
        }

        // 500 - Erro interno
        if (data.cause === 'CREATE_MENU_ERROR' && data.code === 500) {
          toast('Erro ao criar o menu', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'Houve um erro ao criar o menu. Tente novamente mais tarde.',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }
      }

      toast('Erro ao criar o menu', {
        className: '!bg-destructive !text-white !border-destructive',
        description:
          'Houve um erro interno ao criar o menu. Tente novamente mais tarde.',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues: menuFormDefaultValues,
    onSubmit: async ({ value }) => {
      const validation = MenuCreateSchema.safeParse(value);
      if (!validation.success) return;

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
                className="w-full max-w-3xs"
                disabled={isSubmitting}
                onClick={() => {
                  navigate({ to: '/menus', search: { page: 1, perPage: 50 } });
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
                <span>Criar</span>
              </Button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
