import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import type {
  FieldManagementActions,
  VisibilityKey,
  WidthKey,
} from '@/components/common/dynamic-table/field-management/field-management-context';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { useGroupFieldUpdate } from '@/hooks/tanstack-query/use-group-field-update';
import { useUpdateTable } from '@/hooks/tanstack-query/use-table-update';
import { API } from '@/lib/api';
import type { IField, ITable, Paginated } from '@/lib/interfaces';
import { toastError, toastSuccess } from '@/lib/toast';

function buildGroupFieldPayload(
  field: IField,
  groupSlug: string,
  overrides: Partial<IField>,
): Partial<IField> {
  const dropdown = field.dropdown ?? [];
  const category = field.category ?? [];

  let relationship = null;
  if (field.relationship) {
    relationship = {
      table: {
        _id: field.relationship.table._id,
        slug: field.relationship.table.slug,
      },
      field: {
        _id: field.relationship.field._id,
        slug: field.relationship.field.slug,
      },
      order: field.relationship.order,
    };
  }

  return {
    name: field.name,
    type: field.type,
    required: field.required,
    multiple: field.multiple,
    showInFilter: field.showInFilter,
    showInForm: field.showInForm,
    showInDetail: field.showInDetail,
    showInList: field.showInList,
    widthInForm: field.widthInForm ?? 50,
    widthInList: field.widthInList ?? 10,
    widthInDetail: field.widthInDetail ?? 50,
    format: field.format ?? null,
    defaultValue: field.defaultValue ?? null,
    dropdown,
    relationship,
    group: { slug: groupSlug },
    category,
    trashed: field.trashed,
    trashedAt: field.trashedAt ?? null,
    ...overrides,
  };
}

export function useGroupFieldManagement(
  table: ITable | undefined,
  groupSlug: string,
): FieldManagementActions {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [togglingFieldId, setTogglingFieldId] = useState<string | null>(null);
  const [changingWidthFieldId, setChangingWidthFieldId] = useState<
    string | null
  >(null);
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);
  const [restoringFieldId, setRestoringFieldId] = useState<string | null>(null);
  const [pendingWidthKey, setPendingWidthKey] = useState<WidthKey | null>(null);

  const tableSlug = table?.slug ?? '';
  const targetGroup = (table?.groups ?? []).find((g) => g.slug === groupSlug);
  const fields = targetGroup?.fields ?? [];

  const updateTable = useUpdateTable({
    onSuccess: () => {
      toastSuccess('Ordem atualizada com sucesso');
    },
    onError: () => {
      toastError('Erro ao atualizar ordem dos campos');
    },
  });

  const groupFieldUpdate = useGroupFieldUpdate({
    onSuccess: (response) => {
      if (pendingWidthKey) {
        const widthValue = response[pendingWidthKey] ?? 'N/A';
        let unit = '%';
        if (pendingWidthKey === 'widthInList') {
          unit = 'px';
        }
        toastSuccess(`Largura atualizada para ${widthValue}${unit}`);
      } else if (togglingFieldId) {
        // Determine which visibility key was toggled by checking context
        // The toast is generic here since we don't track the key in this callback
        toastSuccess('Campo atualizado com sucesso');
      }
      setTogglingFieldId(null);
      setChangingWidthFieldId(null);
      setPendingWidthKey(null);
    },
    onError: () => {
      toastError('Erro ao atualizar campo do grupo');
      setTogglingFieldId(null);
      setChangingWidthFieldId(null);
      setPendingWidthKey(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (field: IField) => {
      const route = `/tables/${tableSlug}/fields/${field._id}?group=${groupSlug}`;
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
            groups: old.groups.map((g) =>
              g.slug === groupSlug
                ? {
                    ...g,
                    fields: g.fields.filter((f) => f._id !== field._id),
                  }
                : g,
            ),
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
                groups: t.groups.map((g) =>
                  g.slug === groupSlug
                    ? {
                        ...g,
                        fields: g.fields.filter((f) => f._id !== field._id),
                      }
                    : g,
                ),
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
    setTogglingFieldId(field._id);
    setPendingWidthKey(null);
    groupFieldUpdate.mutate({
      tableSlug,
      groupSlug,
      fieldId: field._id,
      data: buildGroupFieldPayload(field, groupSlug, {
        [visibilityKey]: newValue,
      }),
    });
  }

  function onChangeWidth(
    field: IField,
    widthKey: WidthKey,
    newWidth: number,
  ): void {
    setChangingWidthFieldId(field._id);
    setPendingWidthKey(widthKey);
    groupFieldUpdate.mutate({
      tableSlug,
      groupSlug,
      fieldId: field._id,
      data: buildGroupFieldPayload(field, groupSlug, { [widthKey]: newWidth }),
    });
  }

  function onSaveOrder(
    _visibilityKey: VisibilityKey,
    orderedFieldIds: Array<string>,
  ): void {
    if (!table) return;

    const updatedGroups = table.groups.map((g) => {
      if (g.slug === groupSlug) {
        const trashedFields = g.fields.filter((f) => f.trashed);
        const orderedFields = orderedFieldIds.map((id) => ({ _id: id }));
        const trashedFieldRefs = trashedFields.map((f) => ({ _id: f._id }));
        return {
          ...g,
          fields: [...orderedFields, ...trashedFieldRefs],
        };
      }
      return g;
    });

    updateTable.mutate({
      slug: table.slug,
      name: table.name,
      description: table.description,
      logo: table.logo?._id ?? null,
      visibility: table.visibility,
      style: table.style,
      collaboration: table.collaboration,
      fieldOrderList: table.fieldOrderList,
      fieldOrderForm: table.fieldOrderForm,
      administrators: table.administrators.flatMap((admin) => admin._id),
      groups: updatedGroups,
      fields: table.fields.flatMap((f) => f._id),
      methods: {
        ...table.methods,
        afterSave: table.methods.afterSave,
        beforeSave: table.methods.beforeSave,
        onLoad: table.methods.onLoad,
      },
    });
  }

  const restoreMutation = useMutation({
    mutationFn: async (field: IField) => {
      const route = `/tables/${tableSlug}/groups/${groupSlug}/fields/${field._id}/restore`;
      const response = await API.patch<IField>(route);
      return response.data;
    },
    onMutate: (field) => {
      setRestoringFieldId(field._id);
    },
    onSuccess: (response) => {
      queryClient.setQueryData<ITable>(
        queryKeys.tables.detail(tableSlug),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            groups: old.groups.map((g) =>
              g.slug === groupSlug
                ? {
                    ...g,
                    fields: g.fields.map((f) =>
                      f._id === response._id ? response : f,
                    ),
                  }
                : g,
            ),
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
                groups: t.groups.map((g) =>
                  g.slug === groupSlug
                    ? {
                        ...g,
                        fields: g.fields.map((f) =>
                          f._id === response._id ? response : f,
                        ),
                      }
                    : g,
                ),
              };
            }),
          };
        },
      );

      toastSuccess(
        'Campo restaurado',
        'O campo foi restaurado da lixeira com sucesso.',
      );
    },
    onError: () => {
      toastError(
        'Erro ao restaurar campo',
        'Não foi possível restaurar o campo da lixeira. Tente novamente.',
      );
    },
    onSettled: () => {
      setRestoringFieldId(null);
    },
  });

  function onDeleteField(field: IField): void {
    deleteMutation.mutate(field);
  }

  function onRestoreField(field: IField): void {
    restoreMutation.mutate(field);
  }

  function onEditField(fieldId: string): void {
    router.navigate({
      to: '/tables/$slug/field/$fieldId',
      params: { slug: tableSlug, fieldId },
      search: { group: groupSlug },
    });
  }

  return {
    fields,
    fieldOrderList: [],
    fieldOrderForm: [],
    onToggleVisibility,
    onChangeWidth,
    onSaveOrder,
    onDeleteField,
    onRestoreField,
    onEditField,
    togglingFieldId,
    changingWidthFieldId,
    deletingFieldId,
    restoringFieldId,
    isSavingOrder: updateTable.isPending,
  };
}
