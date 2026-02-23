import { useMutation } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';
import z from 'zod';

import {
  CreateFieldFormFields,
  FieldCreateSchema,
  fieldCreateFormDefaultValues,
} from './-create-form';

import type { TreeNode } from '@/components/common/-tree-list';
import { AccessDenied } from '@/components/common/access-denied';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { API } from '@/lib/api';
import type { E_FIELD_FORMAT } from '@/lib/constant';
import { E_FIELD_TYPE, E_TABLE_TYPE } from '@/lib/constant';
import type {
  ICategory,
  IField,
  IRow,
  ITable,
  Paginated,
  ValueOf,
} from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/$slug/field/create/')({
  component: RouteComponent,
  validateSearch: z.object({
    'field-type': z
      .enum(Object.keys(E_FIELD_TYPE) as [string, ...Array<string>])
      .optional(),
    group: z.string().optional(),
  }),
});

function convertTreeNodeToCategory(nodes: Array<TreeNode>): Array<ICategory> {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    children: node.children ? convertTreeNodeToCategory(node.children) : [],
  }));
}

function RouteComponent(): React.JSX.Element {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const { slug } = useParams({
    from: '/_private/tables/$slug/field/create/',
  });

  const { 'field-type': defaultFieldType, group: groupSlug } = useSearch({
    from: '/_private/tables/$slug/field/create/',
  });

  const table = useReadTable({ slug });

  // Se foi fornecido um group slug, é contexto de grupo
  const isGroupContext = !!groupSlug;

  const permission = useTablePermission(table.data);

  // Hooks devem ser chamados ANTES de qualquer early return (Regra dos Hooks do React)
  const _create = useMutation({
    mutationFn: async (
      payload: Partial<IField> & { group?: { slug: string } | string | null },
    ) => {
      const route = '/tables/'.concat(slug).concat('/fields');
      const response = await API.post<IField>(route, payload);
      return response.data;
    },
    onSuccess(response) {
      queryClient.setQueryData<ITable>(queryKeys.tables.detail(slug), (old) => {
        if (!old) return old;

        // Se estamos em contexto de grupo, atualiza groups
        if (isGroupContext && groupSlug) {
          return {
            ...old,
            groups: old.groups.map((g) =>
              g.slug === groupSlug
                ? { ...g, fields: [...g.fields, response] }
                : g,
            ),
          };
        }

        // Atualiza campos da tabela normalmente
        return {
          ...old,
          fields: [...old.fields, response],
          fieldOrderForm: [...old.fieldOrderForm, response.slug],
          fieldOrderList: [...old.fieldOrderList, response.slug],
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
                // Se estamos em contexto de grupo, atualiza groups
                if (isGroupContext && groupSlug) {
                  return {
                    ...t,
                    groups: t.groups.map((g) =>
                      g.slug === groupSlug
                        ? { ...g, fields: [...g.fields, response] }
                        : g,
                    ),
                  };
                }

                return {
                  ...t,
                  fields: [...t.fields, response],
                  fieldOrderForm: [...t.fieldOrderForm, response.slug],
                  fieldOrderList: [...t.fieldOrderList, response.slug],
                };
              }
              return t;
            }),
          };
        },
      );

      // Não atualiza rows quando em contexto de grupo (campos ficam embedded)
      if (!isGroupContext) {
        queryClient.setQueryData<Paginated<IRow>>(
          queryKeys.rows.list(slug, { page: 1, perPage: 50 }),
          (old) => {
            if (!old) return old;
            return {
              meta: old.meta,
              data: old.data.map((row) => ({
                ...row,
                [response.slug]: null,
              })),
            };
          },
        );
      }

      toast('Campo criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O campo foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      sidebar.setOpen(false);
      navigate({
        to: '/tables/$slug',
        replace: true,
        params: { slug },
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        toast('Erro ao criar o campo', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao criar o campo',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues: {
      ...fieldCreateFormDefaultValues,
      type: defaultFieldType ?? '',
    },
    onSubmit: async ({ value }) => {
      const validation = FieldCreateSchema.safeParse(value);
      if (!validation.success) return;

      if (_create.status === 'pending') return;

      const hasRelationship = value.relationship.tableId !== '';
      const hasDropdown = value.dropdown.length > 0;
      const hasCategory = value.category.length > 0;

      await _create.mutateAsync({
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
        group: groupSlug ? { slug: groupSlug } : null,
        category: hasCategory ? convertTreeNodeToCategory(value.category) : [],
        order:
          value.order === 'none'
            ? null
            : (value.order as 'asc' | 'desc'),
      });
    },
  });

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
  if (!permission.can('CREATE_FIELD')) {
    return <AccessDenied />;
  }

  // Blocked types for field-group tables or when in group context
  const blockedTypes =
    isGroupContext ||
    (table.status === 'success' && table.data.type === E_TABLE_TYPE.FIELD_GROUP)
      ? [
          E_FIELD_TYPE.FIELD_GROUP,
          E_FIELD_TYPE.REACTION,
          E_FIELD_TYPE.EVALUATION,
        ]
      : [];

  const isPending = _create.status === 'pending';

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
            {defaultFieldType === E_FIELD_TYPE.FIELD_GROUP
              ? 'Novo grupo de campos'
              : 'Novo campo'}
          </h1>
        </div>
      </div>

      {/* Info text for field group */}
      {defaultFieldType === E_FIELD_TYPE.FIELD_GROUP && (
        <p className="text-sm text-muted-foreground px-2 pb-2">
          O grupo de campos é composto por outros campos que devem ser
          configurados nas configurações da tabela em "Gerenciar grupo de
          campos".
        </p>
      )}

      {/* Content */}
      <form
        className="flex-1 flex flex-col min-h-0 overflow-auto"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {/* @ts-expect-error TanStack Form type instantiation depth issue with nested defaultValues */}
        <CreateFieldFormFields
          form={form}
          isPending={isPending}
          tableSlug={slug}
          blockedTypes={blockedTypes}
          defaultFieldType={defaultFieldType}
        />
      </form>

      {/* Footer */}
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
                  sidebar.setOpen(false);
                  navigate({
                    to: '/tables/$slug',
                    replace: true,
                    params: { slug },
                  });
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
