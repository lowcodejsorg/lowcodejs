import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { MenuUpdateSchema, UpdateMenuFormFields } from './-update-form';
import type { MenuUpdateFormValues } from './-update-form';
import { UpdateMenuFormSkeleton } from './-update-form-skeleton';

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
import type { IMenu, Paginated, ValueOf } from '@/lib/interfaces';

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
        {_read.status === 'success' && <MenuUpdateContent data={_read.data} />}
      </div>
    </div>
  );
}

function MenuUpdateContent({ data }: { data: IMenu }): React.JSX.Element {
  const { queryClient } = getContext();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

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
        const errorData = error.response?.data;

        toast('Erro ao atualizar o menu', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao atualizar o menu',
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
