import { useMutation } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { ArrowLeftIcon, PencilIcon } from 'lucide-react';
import React from 'react';

import { FieldUpdateSchema, UpdateFieldFormFields } from './-update-form';
import { FieldView } from './-view';

import { AccessDenied } from '@/components/common/route-status/access-denied';
import { LoadError } from '@/components/common/route-status/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { useFieldRead } from '@/hooks/tanstack-query/use-field-read';
import { useGroupFieldUpdate } from '@/hooks/tanstack-query/use-group-field-update';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { API } from '@/lib/api';
import type { E_FIELD_FORMAT } from '@/lib/constant';
import { E_FIELD_TYPE } from '@/lib/constant';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import type { IField, ITable, Paginated, ValueOf } from '@/lib/interfaces';
import { QueryClient as queryClient } from '@/lib/query-client';
import { toastSuccess, toastWarning } from '@/lib/toast';

export const Route = createLazyFileRoute(
  '/_private/tables/$slug/field/$fieldId/',
)({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const { slug, fieldId } = useParams({
    from: '/_private/tables/$slug/field/$fieldId/',
  });

  const { group: groupSlug } = useSearch({
    from: '/_private/tables/$slug/field/$fieldId/',
  });

  const table = useReadTable({ slug });
  const _read = useFieldRead({ tableSlug: slug, fieldId, groupSlug });
  const permission = useTablePermission(table.data);

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  // Loading enquanto verifica permissão
  if (table.status === 'pending' || permission.isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Mostrar erro se não tem permissão
  if (!permission.can('UPDATE_FIELD')) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              sidebar.setOpen(false);
              navigate({
                to: '/tables/$slug',
                replace: true,
                params: { slug },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">
            {_read.status === 'success' &&
            _read.data.type === E_FIELD_TYPE.FIELD_GROUP
              ? 'Detalhes do grupo de campos'
              : 'Detalhes do campo'}
          </h1>
        </div>
        {_read.status === 'success' &&
          mode === 'show' &&
          permission.can('UPDATE_FIELD') &&
          !(_read.data as IField & { trashed?: boolean }).trashed &&
          (!_read.data.locked || _read.data.type === E_FIELD_TYPE.DROPDOWN) && (
            <Button
              type="button"
              className="px-2 cursor-pointer"
              size="sm"
              onClick={() => setMode('edit')}
            >
              <PencilIcon className="size-4 mr-1" />
              <span>Editar</span>
            </Button>
          )}
      </div>

      {/* Info text for field group */}
      {_read.status === 'success' &&
        _read.data.type === E_FIELD_TYPE.FIELD_GROUP && (
          <p className="text-sm text-muted-foreground px-2 pb-2">
            O grupo de campos é composto por outros campos que devem ser
            configurados nas configurações da tabela em "Gerenciar grupo de
            campos".
          </p>
        )}
      {_read.status === 'success' && _read.data.locked && (
        <p className="text-sm text-amber-600 px-2 pb-2">
          Este campo faz parte de uma predefinição e não pode ser alterado ou
          removido.
        </p>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {_read.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados do campo"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && (
          <div className="p-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {_read.status === 'success' && (
          <FieldUpdateContent
            data={_read.data}
            slug={slug}
            mode={mode}
            setMode={setMode}
            groupSlug={groupSlug}
          />
        )}
      </div>
    </div>
  );
}

interface FieldUpdateContentProps {
  data: IField;
  slug: string;
  mode: 'show' | 'edit';
  setMode: React.Dispatch<React.SetStateAction<'show' | 'edit'>>;
  /** Slug do grupo (quando em contexto de grupo) */
  groupSlug?: string;
}

function FieldUpdateContent({
  data,
  slug,
  mode,
  setMode,
  groupSlug,
}: FieldUpdateContentProps): React.JSX.Element {
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const goBack = (): void => {
    sidebar.setOpen(false);
    navigate({
      to: '/tables/$slug',
      replace: true,
      params: { slug },
    });
  };

  const handleUpdateSuccess = (response: IField): void => {
    const wasTrashed = Boolean(
      (data as IField & { trashed?: boolean }).trashed,
    );
    const isTrashed = Boolean(response.trashed);

    if (!wasTrashed && isTrashed) {
      toastWarning(
        'Campo enviado para lixeira',
        'O campo foi enviado para a lixeira. Para restaurá-lo, acesse o gerenciamento de campos.',
      );
    } else if (wasTrashed && !isTrashed) {
      toastSuccess(
        'Campo restaurado',
        'O campo foi restaurado. Para enviá-lo à lixeira, acesse o gerenciamento de campos.',
      );
    } else {
      toastSuccess(
        'Campo atualizado',
        'Os dados do campo foram atualizados com sucesso',
      );
    }

    form.reset();
    setMode('show');
  };

  const handleUpdateError = (error: Error): void => {
    handleApiError(error, {
      context: 'Erro ao atualizar o campo',
      onFieldErrors: (errors) => {
        const setFieldError = createFieldErrorSetter(form);
        for (const [field, msg] of Object.entries(errors)) {
          setFieldError(field, msg);
        }
      },
    });
  };

  const _update = useMutation({
    mutationFn: async (
      payload: Partial<IField> & {
        trashed?: boolean;
        trashedAt?: string | null;
      },
    ) => {
      const response = await API.put<IField>(
        `/tables/${slug}/fields/${data._id}`,
        payload,
      );
      return response.data;
    },
    onSuccess(response) {
      queryClient.setQueryData<IField>(
        queryKeys.fields.detail(slug, response._id),
        response,
      );

      queryClient.setQueryData<ITable>(queryKeys.tables.detail(slug), (old) => {
        if (!old) return old;
        return {
          ...old,
          fields: old.fields.map((f) =>
            f._id === response._id ? response : f,
          ),
        };
      });

      queryClient.setQueryData<Paginated<ITable>>(
        queryKeys.tables.list({ page: 1, perPage: 50 }),
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((t) => {
              if (t.slug === slug) {
                return {
                  ...t,
                  fields: t.fields.map((f) =>
                    f._id === response._id ? response : f,
                  ),
                };
              }
              return t;
            }),
          };
        },
      );

      handleUpdateSuccess(response);
    },
    onError: handleUpdateError,
  });

  const _updateGroupField = useGroupFieldUpdate({
    onSuccess: handleUpdateSuccess,
    onError: handleUpdateError,
  });

  const form = useAppForm({
    defaultValues: {
      name: data.name,
      type: data.type as string,
      format: data.format ?? '',
      defaultValue: data.defaultValue ?? '',
      dropdown: (data.dropdown ?? []).map((d) => ({
        id: d.id,
        label: d.label,
        color: d.color,
      })),
      relationship: {
        tableId: data.relationship?.table?._id ?? '',
        tableSlug: data.relationship?.table?.slug ?? '',
        fieldId: data.relationship?.field?._id ?? '',
        fieldSlug: data.relationship?.field?.slug ?? '',
        order: data.relationship?.order ?? '',
      },
      category: data.category ?? [],
      multiple: data.multiple,
      showInFilter: data.showInFilter,
      showInForm: data.showInForm,
      showInDetail: data.showInDetail,
      showInList: data.showInList,
      required: data.required,
      trashed: Boolean((data as IField & { trashed?: boolean }).trashed),
      widthInForm: data.widthInForm ?? 50,
      widthInList: data.widthInList ?? 10,
    },
    // @ts-expect-error Zod Standard Schema type inference
    validators: { onChange: FieldUpdateSchema, onSubmit: FieldUpdateSchema },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending' || _updateGroupField.isPending) return;

      const hasRelationship = value.relationship.tableId !== '';
      const hasDropdown = value.dropdown.length > 0;
      const hasCategory = value.category.length > 0;

      const payload: Partial<IField> & {
        trashed?: boolean;
        trashedAt?: string | null;
      } = {
        name: value.name,
        type: value.type as keyof typeof E_FIELD_TYPE,
        required: value.required,
        multiple: value.multiple,
        showInFilter: value.showInFilter,
        showInForm: value.showInForm,
        showInDetail: value.showInDetail,
        showInList: value.showInList,
        widthInForm: value.widthInForm,
        widthInList: value.widthInList,
        format: value.format
          ? (value.format as ValueOf<typeof E_FIELD_FORMAT>)
          : null,
        defaultValue: value.defaultValue || null,
        dropdown: hasDropdown ? value.dropdown.map((item) => item) : [],
        relationship: hasRelationship
          ? {
              table: {
                _id: value.relationship.tableId,
                slug: value.relationship.tableSlug,
              },
              field: {
                _id: value.relationship.fieldId,
                slug: value.relationship.fieldSlug,
              },
              order: (value.relationship.order || 'asc') as 'asc' | 'desc',
            }
          : null,
        category: hasCategory
          ? (value.category as unknown as IField['category'])
          : [],
        trashed: value.trashed,
        trashedAt: value.trashed ? new Date().toISOString() : null,
      };

      if (groupSlug) {
        await _updateGroupField.mutateAsync({
          tableSlug: slug,
          groupSlug,
          fieldId: data._id,
          data: payload,
        });
      } else {
        await _update.mutateAsync(payload);
      }
    },
  });

  const isPending = _update.status === 'pending' || _updateGroupField.isPending;

  return (
    <>
      {mode === 'show' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <FieldView data={data} />
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
          {/* @ts-ignore TanStack Form type depth issue with nested configuration */}
          <UpdateFieldFormFields
            form={form}
            isPending={isPending}
            mode={mode}
            tableSlug={slug}
            isLocked={data.locked ?? false}
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
