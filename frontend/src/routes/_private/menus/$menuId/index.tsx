import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { AxiosError } from 'axios';
import { ArrowLeftIcon, PencilIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { MenuUpdateSchema, UpdateMenuFormFields } from './-update-form';
import type { MenuUpdateFormValues } from './-update-form';
import { UpdateMenuFormSkeleton } from './-update-form-skeleton';
import { MenuView } from './-view';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useReadMenu } from '@/hooks/tanstack-query/use-menu-read';
import { useUpdateMenu } from '@/hooks/tanstack-query/use-menu-update';
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

export const Route = createFileRoute('/_private/menus/$menuId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { menuId } = useParams({
    from: '/_private/menus/$menuId/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const _read = useReadMenu({ menuId });

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
                to: '/menus',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Detalhes do menu</h1>
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
            message="Houve um erro ao buscar dados do menu"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateMenuFormSkeleton />}
        {_read.status === 'success' && (
          <MenuUpdateContent
            data={_read.data}
            mode={mode}
            setMode={setMode}
          />
        )}
      </div>
    </div>
  );
}

interface MenuUpdateContentProps {
  data: IMenu;
  mode: 'show' | 'edit';
  setMode: React.Dispatch<React.SetStateAction<'show' | 'edit'>>;
}

function MenuUpdateContent({
  data,
  mode,
  setMode,
}: MenuUpdateContentProps): React.JSX.Element {
  const { queryClient } = getContext();

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

  const _update = useUpdateMenu({
    onSuccess(updatedData) {
      queryClient.setQueryData<IMenu>(
        ['/menu/'.concat(updatedData._id), updatedData._id],
        updatedData,
      );
      queryClient.setQueryData<Paginated<IMenu>>(
        ['/menu/paginated', { page: 1, perPage: 50 }],
        (cached) => {
          if (!cached) {
            return {
              meta: MetaDefault,
              data: [updatedData],
            };
          }

          return {
            meta: cached.meta,
            data: cached.data.map((item) => {
              if (item._id === updatedData._id)
                return {
                  ...item,
                  ...updatedData,
                };

              return item;
            }),
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: ['/menu'],
      });

      toast('Menu atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'Os dados do menu foram atualizados com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as IHTTPExeptionError<{
          name?: string;
          type?: string;
          table?: string;
          parent?: string;
          html?: string;
          url?: string;
        }>;

        // 404 - Menu não encontrado
        if (errorData.cause === 'MENU_NOT_FOUND' && errorData.code === 404) {
          toast('Menu não encontrado', {
            className: '!bg-destructive !text-white !border-destructive',
            description: 'O menu que você está tentando atualizar não existe',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 404 - Menu pai não encontrado
        if (
          errorData.cause === 'PARENT_MENU_NOT_FOUND' &&
          errorData.code === 404
        ) {
          setFieldError('parent', 'Menu pai não encontrado');
          return;
        }

        // 409 - Menu já existe
        if (
          errorData.cause === 'MENU_ALREADY_EXISTS' &&
          errorData.code === 409
        ) {
          setFieldError('name', 'Já existe um menu com este nome');
          return;
        }

        // 404 - Tabela não encontrada
        if (errorData.cause === 'TABLE_NOT_FOUND' && errorData.code === 404) {
          setFieldError('table', 'Tabela não encontrada');
          return;
        }

        // 400 - Parâmetros inválidos
        if (
          errorData.cause === 'INVALID_PARAMETERS' &&
          errorData.code === 400
        ) {
          setFieldError('table', 'Tabela é obrigatória para este tipo de menu');
          return;
        }

        // 400 - Erros de validação
        if (
          errorData.cause === 'INVALID_PAYLOAD_FORMAT' &&
          errorData.code === 400
        ) {
          if (errorData.errors['name'])
            setFieldError('name', errorData.errors['name']);
          if (errorData.errors['type'])
            setFieldError('type', errorData.errors['type']);
          if (errorData.errors['table'])
            setFieldError('table', errorData.errors['table']);
          if (errorData.errors['parent'])
            setFieldError('parent', errorData.errors['parent']);
          if (errorData.errors['html'])
            setFieldError('html', errorData.errors['html']);
          if (errorData.errors['url'])
            setFieldError('url', errorData.errors['url']);
          return;
        }

        // 500 - Erro interno
        if (errorData.cause === 'UPDATE_MENU_ERROR' && errorData.code === 500) {
          toast('Erro ao atualizar o menu', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'Houve um erro ao atualizar o menu. Tente novamente mais tarde.',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }
      }

      toast('Erro ao atualizar o menu', {
        className: '!bg-destructive !text-white !border-destructive',
        description:
          'Houve um erro interno ao atualizar o menu. Tente novamente mais tarde.',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: data.name,
      type: data.type,
      table: data.table?._id ?? '',
      html: data.html ?? '',
      url: data.url ?? '',
      parent: data.parent?._id ?? '',
    } satisfies MenuUpdateFormValues,
    onSubmit: async ({ value }) => {
      const validation = MenuUpdateSchema.safeParse(value);
      if (!validation.success) return;

      if (_update.status === 'pending') return;

      await _update.mutateAsync({
        _id: data._id,
        name: value.name,
        type: value.type,
        parent: value.parent || null,
        table: value.table || null,
        html: value.html || null,
        url: value.url || null,
      });
    },
  });

  const isPending = _update.status === 'pending';
  const menuType = useStore(form.store, (state) => state.values.type) as
    | ValueOf<typeof E_MENU_ITEM_TYPE>
    | '';

  return (
    <>
      {mode === 'show' && <MenuView data={data} />}

      {mode === 'edit' && (
        <form
          className="flex-1 flex flex-col min-h-0 overflow-auto"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <UpdateMenuFormFields
            form={form}
            isPending={isPending}
            mode={mode}
            menuType={menuType}
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
