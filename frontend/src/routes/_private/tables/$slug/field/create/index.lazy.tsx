import {
  createLazyFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

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
import { useFieldCreate } from '@/hooks/tanstack-query/use-field-create';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import type { E_FIELD_FORMAT } from '@/lib/constant';
import { E_FIELD_TYPE, E_TABLE_TYPE } from '@/lib/constant';
import { handleApiError } from '@/lib/handle-api-error';
import type { ICategory, ValueOf } from '@/lib/interfaces';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute(
  '/_private/tables/$slug/field/create/',
)({
  component: RouteComponent,
});

function convertTreeNodeToCategory(nodes: Array<TreeNode>): Array<ICategory> {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    children: node.children ? convertTreeNodeToCategory(node.children) : [],
  }));
}

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const { slug } = useParams({
    from: '/_private/tables/$slug/field/create/',
  });

  const { 'field-type': defaultFieldType, group: groupSlug } = useSearch({
    from: '/_private/tables/$slug/field/create/',
  });

  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

  // Hooks devem ser chamados ANTES de qualquer early return (Regra dos Hooks do React)
  const _create = useFieldCreate({
    slug,
    groupSlug,
    onSuccess() {
      toastSuccess('Campo criado', 'O campo foi criado com sucesso');
      form.reset();
      sidebar.setOpen(false);
      navigate({
        to: '/tables/$slug',
        replace: true,
        params: { slug },
      });
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao criar o campo',
      });
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
    !!groupSlug ||
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
        id="field-create-form"
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
                type="submit"
                form="field-create-form"
                className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                disabled={!canSubmit}
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
