import { useMutation } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import z from 'zod';

import { FieldUpdateSchema, UpdateFieldFormFields } from './-update-form';

import { AccessDenied } from '@/components/common/access-denied';
import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useFieldRead } from '@/hooks/tanstack-query/use-field-read';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { API } from '@/lib/api';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { E_FIELD_FORMAT } from '@/lib/constant';
import type { IField, ITable, Paginated } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/$slug/field/$fieldId/')({
  component: RouteComponent,
  validateSearch: z.object({
    from: z.string().optional(),
  }),
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const { slug, fieldId } = useParams({
    from: '/_private/tables/$slug/field/$fieldId/',
  });

  const { from } = useSearch({
    from: '/_private/tables/$slug/field/$fieldId/',
  });

  const originSlug = from ?? slug;

  const table = useReadTable({ slug });
  const _read = useFieldRead({ tableSlug: slug, fieldId });
  const permission = useTablePermission(table.data);

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
                params: { slug: originSlug },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">
            {_read.status === 'success' && _read.data.type === E_FIELD_TYPE.FIELD_GROUP
              ? 'Detalhes do grupo de campos'
              : 'Detalhes do campo'}
          </h1>
        </div>
      </div>

      {/* Info text for field group */}
      {_read.status === 'success' && _read.data.type === E_FIELD_TYPE.FIELD_GROUP && (
        <p className="text-sm text-muted-foreground px-2 pb-2">
          O grupo de campos é composto por outros campos que devem ser
          configurados nas configurações da tabela em "Gerenciar grupo de
          campos".
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
          />
        )}
      </div>
    </div>
  );
}

function FieldUpdateContent({
  data,
  slug,
}: {
  data: IField;
  slug: string;
}): React.JSX.Element {
  const { queryClient } = getContext();
  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);
  const canEdit = permission.can('UPDATE_FIELD');

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const _update = useMutation({
    mutationFn: async (
      payload: Partial<IField> & {
        trashed?: boolean;
        trashedAt?: string | null;
      },
    ) => {
      const route = '/tables/'.concat(slug).concat('/fields/').concat(data._id);
      const response = await API.put<IField>(route, payload);
      return response.data;
    },
    onSuccess(response) {
      queryClient.setQueryData<IField>(
        [
          '/tables/'.concat(slug).concat('/fields/').concat(response._id),
          response._id,
        ],
        response,
      );

      queryClient.setQueryData<ITable>(
        ['/tables/'.concat(slug), slug],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: old.fields.map((f) => {
              if (f._id === response._id) {
                return response;
              }
              return f;
            }),
          };
        },
      );

      queryClient.setQueryData<Paginated<ITable>>(
        ['/tables/paginated', { page: 1, perPage: 50 }],
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((table) => {
              if (table.slug === slug) {
                return {
                  ...table,
                  fields: table.fields.map((f) => {
                    if (f._id === response._id) {
                      return response;
                    }
                    return f;
                  }),
                };
              }
              return table;
            }),
          };
        },
      );

      const wasTrashed = Boolean(
        (data as IField & { trashed?: boolean }).trashed,
      );
      const isTrashed = Boolean(response.trashed);

      if (!wasTrashed && isTrashed) {
        toast('Campo enviado para lixeira', {
          className: '!bg-amber-600 !text-white !border-amber-600',
          description:
            'O campo foi enviado para a lixeira. Para restaurá-lo, acesse o gerenciamento de campos.',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      } else if (wasTrashed && !isTrashed) {
        toast('Campo restaurado', {
          className: '!bg-green-600 !text-white !border-green-600',
          description:
            'O campo foi restaurado. Para enviá-lo à lixeira, acesse o gerenciamento de campos.',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      } else {
        toast('Campo atualizado', {
          className: '!bg-green-600 !text-white !border-green-600',
          description: 'Os dados do campo foram atualizados com sucesso',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;

        if (
          errorData?.code === 400 &&
          errorData?.cause === 'INVALID_PARAMETERS'
        ) {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Dados inválidos',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 401 &&
          errorData?.cause === 'AUTHENTICATION_REQUIRED'
        ) {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Autenticação necessária',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 403 && errorData?.cause === 'ACCESS_DENIED') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              errorData?.message ??
              'Permissões insuficientes para atualizar este campo',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 404 && errorData?.cause === 'FIELD_NOT_FOUND') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Campo não encontrado',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 409 &&
          errorData?.cause === 'LAST_ACTIVE_FIELD'
        ) {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'Último campo ativo, não pode ser enviado para a lixeira',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 409 &&
          errorData?.cause === 'FIELD_ALREADY_EXISTS'
        ) {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              errorData?.message ?? 'Já existe um campo com este nome',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 409 && errorData?.cause === 'FIELD_IN_USE') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              errorData?.message ??
              'Não é possível alterar o tipo do campo: o campo contém dados',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 422 &&
          errorData?.cause === 'UNPROCESSABLE_ENTITY'
        ) {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Configuração de campo inválida',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 500 && errorData?.cause === 'SERVER_ERROR') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Erro interno do servidor',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        toast('Erro ao atualizar o campo', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao atualizar o campo',
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
      type: data.type as string,
      configuration: {
        format: data.configuration.format ?? '',
        defaultValue: data.configuration.defaultValue ?? '',
        dropdown:
          data.configuration.dropdown?.map((d) => ({
            value: d,
            label: d,
          })) ?? [],
        relationship: {
          tableId: data.configuration.relationship?.table._id ?? '',
          tableSlug: data.configuration.relationship?.table.slug ?? '',
          fieldId: data.configuration.relationship?.field._id ?? '',
          fieldSlug: data.configuration.relationship?.field.slug ?? '',
          order: data.configuration.relationship?.order ?? '',
        },
        category: data.configuration.category ?? [],
        multiple: data.configuration.multiple,
        filtering: data.configuration.filtering,
        listing: data.configuration.listing,
        required: data.configuration.required,
      },
      trashed: Boolean((data as IField & { trashed?: boolean }).trashed),
    },
    onSubmit: async ({ value }) => {
      const validation = FieldUpdateSchema.safeParse(value);
      if (!validation.success) return;

      if (_update.status === 'pending') return;

      const config = value.configuration;
      const hasRelationship = config.relationship.tableId !== '';
      const hasDropdown = config.dropdown.length > 0;
      const hasCategory = config.category.length > 0;

      await _update.mutateAsync({
        name: value.name,
        type: value.type as keyof typeof E_FIELD_TYPE,
        configuration: {
          required: config.required,
          multiple: config.multiple,
          listing: config.listing,
          filtering: config.filtering,
          format: config.format
            ? (config.format as (typeof E_FIELD_FORMAT)[keyof typeof E_FIELD_FORMAT])
            : null,
          defaultValue: config.defaultValue || null,
          dropdown: hasDropdown
            ? config.dropdown.map((item) => item.value)
            : null,
          relationship: hasRelationship
            ? {
                table: {
                  _id: config.relationship.tableId,
                  slug: config.relationship.tableSlug,
                },
                field: {
                  _id: config.relationship.fieldId,
                  slug: config.relationship.fieldSlug,
                },
                order: (config.relationship.order || 'asc') as 'asc' | 'desc',
              }
            : null,
          group: null,
          category: hasCategory
            ? (config.category as unknown as IField['configuration']['category'])
            : null,
        },
        trashed: value.trashed,
        trashedAt: value.trashed ? new Date().toISOString() : null,
      });
    },
  });

  const isPending = _update.status === 'pending';

  return (
    <>
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
        />
      </form>

      {/* Footer */}
      <div className="shrink-0 border-t p-2">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <div className="flex justify-end space-x-2">
              {mode === 'show' && canEdit && (
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
