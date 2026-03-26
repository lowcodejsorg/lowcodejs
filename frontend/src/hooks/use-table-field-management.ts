import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import type {
  FieldManagementActions,
  VisibilityKey,
  WidthKey,
} from '@/components/common/field-management/field-management-context';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { useUpdateTable } from '@/hooks/tanstack-query/use-table-update';
import { API } from '@/lib/api';
import type { IField, ITable, Paginated } from '@/lib/interfaces';
import { toastError, toastSuccess } from '@/lib/toast';

function buildFieldPayload(
  field: IField,
  overrides: Partial<IField>,
): Record<string, unknown> {
  const hasRelationship = field.relationship !== null;
  const hasDropdown = field.dropdown.length > 0;
  const hasCategory = field.category.length > 0;

  return {
    name: field.name,
    type: field.type,
    required: field.required,
    multiple: field.multiple,
    showInFilter: field.showInFilter,
    showInForm: field.showInForm,
    showInDetail: field.showInDetail,
    showInList: field.showInList,
    widthInForm: field.widthInForm,
    widthInList: field.widthInList,
    widthInDetail: field.widthInDetail,
    format: field.format ?? null,
    defaultValue: field.defaultValue ?? null,
    dropdown: hasDropdown ? field.dropdown : [],
    relationship: hasRelationship
      ? {
          table: {
            _id: field.relationship!.table._id,
            slug: field.relationship!.table.slug,
          },
          field: {
            _id: field.relationship!.field._id,
            slug: field.relationship!.field.slug,
          },
          order: field.relationship!.order,
        }
      : null,
    group: field.group,
    category: hasCategory ? field.category : [],
    trashed: field.trashed,
    trashedAt: field.trashedAt ?? null,
    ...overrides,
  };
}

const VISIBILITY_LABELS: Record<VisibilityKey, string> = {
  showInList: 'listagem',
  showInFilter: 'filtros',
  showInForm: 'formulários',
  showInDetail: 'detalhes',
};

function updateFieldInTableCache(
  queryClient: ReturnType<typeof useQueryClient>,
  tableSlug: string,
  response: IField,
): void {
  queryClient.setQueryData<IField>(
    queryKeys.fields.detail(tableSlug, response._id),
    response,
  );

  queryClient.setQueryData<ITable>(
    queryKeys.tables.detail(tableSlug),
    (old) => {
      if (!old) return old;
      return {
        ...old,
        fields: old.fields.map((f) => (f._id === response._id ? response : f)),
      };
    },
  );

  queryClient.setQueryData<Paginated<ITable>>(
    queryKeys.tables.list({ page: 1, perPage: 50 }),
    (old) => {
      if (!old) return old;
      return {
        meta: old.meta,
        data: old.data.map((t) => {
          if (t.slug !== tableSlug) return t;
          return {
            ...t,
            fields: t.fields.map((f) =>
              f._id === response._id ? response : f,
            ),
          };
        }),
      };
    },
  );
}

export function useTableFieldManagement(
  table: ITable | undefined,
): FieldManagementActions {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [togglingFieldId, setTogglingFieldId] = useState<string | null>(null);
  const [changingWidthFieldId, setChangingWidthFieldId] = useState<
    string | null
  >(null);
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);

  const tableSlug = table?.slug ?? '';
  const fields = table?.fields ?? [];

  const updateTable = useUpdateTable({
    onSuccess: () => {
      toastSuccess('Ordem atualizada com sucesso');
    },
    onError: () => {
      toastError('Erro ao atualizar ordem dos campos');
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({
      field,
      visibilityKey,
      newValue,
    }: {
      field: IField;
      visibilityKey: VisibilityKey;
      newValue: boolean;
    }) => {
      const route = `/tables/${tableSlug}/fields/${field._id}`;
      const response = await API.put<IField>(
        route,
        buildFieldPayload(field, { [visibilityKey]: newValue }),
      );
      return { data: response.data, visibilityKey };
    },
    onMutate: ({ field }) => {
      setTogglingFieldId(field._id);
    },
    onSuccess: ({ data: response, visibilityKey }) => {
      updateFieldInTableCache(queryClient, tableSlug, response);
      const label = VISIBILITY_LABELS[visibilityKey];
      if (response[visibilityKey]) {
        toastSuccess(`Campo visível em ${label}`);
      } else {
        toastSuccess(`Campo oculto em ${label}`);
      }
    },
    onError: () => {
      toastError('Erro ao atualizar visibilidade do campo');
    },
    onSettled: () => {
      setTogglingFieldId(null);
    },
  });

  const changeWidthMutation = useMutation({
    mutationFn: async ({
      field,
      widthKey,
      newWidth,
    }: {
      field: IField;
      widthKey: WidthKey;
      newWidth: number;
    }) => {
      const route = `/tables/${tableSlug}/fields/${field._id}`;
      const response = await API.put<IField>(
        route,
        buildFieldPayload(field, { [widthKey]: newWidth }),
      );
      return { data: response.data, widthKey };
    },
    onMutate: ({ field }) => {
      setChangingWidthFieldId(field._id);
    },
    onSuccess: ({ data: response, widthKey }) => {
      updateFieldInTableCache(queryClient, tableSlug, response);
      let unit = '%';
      if (widthKey === 'widthInList') {
        unit = 'px';
      }
      toastSuccess(`Largura atualizada para ${response[widthKey]}${unit}`);
    },
    onError: () => {
      toastError('Erro ao atualizar largura do campo');
    },
    onSettled: () => {
      setChangingWidthFieldId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (field: IField) => {
      const route = `/tables/${tableSlug}/fields/${field._id}`;
      await API.delete(route);
      return field;
    },
    onMutate: (field) => {
      setDeletingFieldId(field._id);
    },
    onSuccess: (field) => {
      queryClient.setQueryData<ITable>(
        queryKeys.tables.detail(tableSlug),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: old.fields.filter((f) => f._id !== field._id),
          };
        },
      );

      queryClient.setQueryData<Paginated<ITable>>(
        queryKeys.tables.list({ page: 1, perPage: 50 }),
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((t) => {
              if (t.slug !== tableSlug) return t;
              return {
                ...t,
                fields: t.fields.filter((f) => f._id !== field._id),
              };
            }),
          };
        },
      );

      toastSuccess(`Campo "${field.name}" excluído permanentemente`);
    },
    onError: (error) => {
      console.error(error);
      toastError(
        'Erro ao excluir campo',
        'Não foi possível excluir o campo permanentemente. Tente novamente.',
      );
    },
    onSettled: () => {
      setDeletingFieldId(null);
    },
  });

  function onToggleVisibility(
    field: IField,
    visibilityKey: VisibilityKey,
    newValue: boolean,
  ): void {
    toggleVisibilityMutation.mutate({ field, visibilityKey, newValue });
  }

  function onChangeWidth(
    field: IField,
    widthKey: WidthKey,
    newWidth: number,
  ): void {
    changeWidthMutation.mutate({ field, widthKey, newWidth });
  }

  function onSaveOrder(
    visibilityKey: VisibilityKey,
    orderedFieldIds: Array<string>,
  ): void {
    if (!table) return;

    const isForm = visibilityKey === 'showInForm';
    updateTable.mutate({
      slug: table.slug,
      name: table.name,
      description: table.description,
      logo: table.logo?._id ?? null,
      visibility: table.visibility,
      style: table.style,
      collaboration: table.collaboration,
      fieldOrderList: isForm ? table.fieldOrderList : orderedFieldIds,
      fieldOrderForm: isForm ? orderedFieldIds : table.fieldOrderForm,
      administrators: table.administrators.flatMap((admin) => admin._id),
      fields: table.fields.flatMap((f) => f._id),
      methods: {
        ...table.methods,
        afterSave: table.methods.afterSave,
        beforeSave: table.methods.beforeSave,
        onLoad: table.methods.onLoad,
      },
    });
  }

  function onDeleteField(field: IField): void {
    deleteMutation.mutate(field);
  }

  function onEditField(fieldId: string): void {
    router.navigate({
      to: '/tables/$slug/field/$fieldId',
      params: { slug: tableSlug, fieldId },
    });
  }

  return {
    fields,
    onToggleVisibility,
    onChangeWidth,
    onSaveOrder,
    onDeleteField,
    onEditField,
    togglingFieldId,
    changingWidthFieldId,
    deletingFieldId,
    isSavingOrder: updateTable.isPending,
  };
}
