import {
  createLazyFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';

import { CreateFieldSkeleton } from './-create-field-skeleton';
import {
  CreateFieldFormFields,
  FieldCreateSchema,
  fieldCreateFormDefaultValues,
} from './-create-form';

import { FormFooter } from '@/components/common/form-footer';
import { PageHeader, PageShell } from '@/components/common/page-shell';
import { AccessDenied } from '@/components/common/route-status/access-denied';
import type { TreeNode } from '@/components/common/tree-editor/tree-list';
import { useSidebar } from '@/components/ui/sidebar';
import { useFieldCreate } from '@/hooks/tanstack-query/use-field-create';
import { useGroupFieldCreate } from '@/hooks/tanstack-query/use-group-field-create';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { useApiErrorAutoClear } from '@/integrations/tanstack-form/use-api-error-auto-clear';
import type { E_FIELD_FORMAT } from '@/lib/constant';
import { E_FIELD_TYPE, E_TABLE_TYPE } from '@/lib/constant';
import { applyApiFieldErrors } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import type { ICategory, IField, ValueOf } from '@/lib/interfaces';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute(
  '/_private/tables/$slug/field/create/',
)({
  component: RouteComponent,
});

function normalizeDefaultValue(
  type: string,
  defaultValue: string | Array<string>,
): string | Array<string> | null {
  const arrayTypes: Array<string> = [
    E_FIELD_TYPE.DROPDOWN,
    E_FIELD_TYPE.CATEGORY,
    E_FIELD_TYPE.USER,
    E_FIELD_TYPE.RELATIONSHIP,
  ];

  if (arrayTypes.includes(type)) {
    if (Array.isArray(defaultValue)) {
      return defaultValue.length > 0 ? defaultValue : null;
    }
    if (defaultValue) return [defaultValue];
    return null;
  }

  // TEXT_SHORT, TEXT_LONG, DATE → string
  if (Array.isArray(defaultValue)) {
    return defaultValue.length > 0 ? defaultValue[0] : null;
  }
  return defaultValue || null;
}

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

  const onCreateSuccess = (): void => {
    toastSuccess('Campo criado', 'O campo foi criado com sucesso');
    form.reset();
    sidebar.setOpen(false);
    navigate({
      to: '/tables/$slug',
      replace: true,
      params: { slug },
    });
  };

  const onCreateError = (error: Error): void => {
    handleApiError(error, {
      context: 'Erro ao criar o campo',
      onFieldErrors: (errors) => applyApiFieldErrors(form, errors),
    });
  };

  // Hooks devem ser chamados ANTES de qualquer early return (Regra dos Hooks do React)
  const _create = useFieldCreate({
    slug,
    onSuccess: onCreateSuccess,
    onError: onCreateError,
  });

  const _createGroupField = useGroupFieldCreate({
    onSuccess: onCreateSuccess,
    onError: onCreateError,
  });

  const form = useAppForm({
    defaultValues: {
      ...fieldCreateFormDefaultValues,
      type: defaultFieldType ?? '',
    },
    // @ts-expect-error Zod Standard Schema type inference
    validators: { onChange: FieldCreateSchema, onSubmit: FieldCreateSchema },
    onSubmit: async ({ value }) => {
      if (
        _create.status === 'pending' ||
        _createGroupField.status === 'pending'
      )
        return;

      const hasRelationship = value.relationship.tableId !== '';
      const hasDropdown = value.dropdown.length > 0;
      const hasCategory = value.category.length > 0;

      const payload: Partial<IField> = {
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
        defaultValue: normalizeDefaultValue(value.type, value.defaultValue),
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
        category: hasCategory ? convertTreeNodeToCategory(value.category) : [],
      };

      if (groupSlug) {
        await _createGroupField.mutateAsync({
          tableSlug: slug,
          groupSlug,
          data: payload,
        });
      } else {
        await _create.mutateAsync({
          ...payload,
          group: null,
        });
      }
    },
  });

  useApiErrorAutoClear(form);

  // Loading enquanto verifica permissão
  if (table.status === 'pending' || permission.isLoading) {
    return <CreateFieldSkeleton />;
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

  const isPending =
    _create.status === 'pending' || _createGroupField.status === 'pending';

  const goBack = (): void => {
    sidebar.setOpen(false);
    navigate({
      to: '/tables/$slug',
      replace: true,
      params: { slug },
    });
  };

  return (
    <PageShell data-test-id="create-field-page">
      {/* Header */}
      <PageShell.Header borderBottom={false}>
        <PageHeader
          onBack={goBack}
          title={
            defaultFieldType === E_FIELD_TYPE.FIELD_GROUP
              ? 'Novo grupo de campos'
              : 'Novo campo'
          }
        />
      </PageShell.Header>

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
        data-test-id="create-field-form"
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
      <PageShell.Footer>
        <FormFooter
          form={form}
          onCancel={goBack}
          submitLabel="Criar"
          submitTestId="create-field-submit-btn"
        />
      </PageShell.Footer>
    </PageShell>
  );
}
