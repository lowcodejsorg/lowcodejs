import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import {
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  LoaderCircleIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { useGroupFieldUpdate } from '@/hooks/tanstack-query/use-group-field-update';
import { useUpdateTable } from '@/hooks/tanstack-query/use-table-update';
import { API } from '@/lib/api';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, ITable, Paginated } from '@/lib/interfaces';
import { toastError, toastSuccess } from '@/lib/toast';

// --- Componentes auxiliares ---

interface SortableGroupFieldItemProps {
  field: IField;
  disabled?: boolean;
  visibilityKey: 'showInFilter' | 'showInForm' | 'showInDetail' | 'showInList';
  widthKey?: 'widthInForm' | 'widthInList';
  onEdit: () => void;
  onToggleVisibility: () => void;
  onWidthChange?: (width: number) => void;
  isTogglingVisibility?: boolean;
  isChangingWidth?: boolean;
}

function SortableGroupFieldItem({
  field,
  disabled,
  visibilityKey,
  widthKey,
  onEdit,
  onToggleVisibility,
  onWidthChange,
  isTogglingVisibility,
  isChangingWidth,
}: SortableGroupFieldItemProps): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field._id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVisible = field[visibilityKey];
  const currentWidth = widthKey ? (field[widthKey] ?? 50) : null;
  const isNative = !!field.native;

  const [localWidth, setLocalWidth] = useState<string>(
    String(currentWidth ?? 0),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalWidth(String(currentWidth ?? 0));
  }, [currentWidth]);

  useEffect(() => {
    return (): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 shadow-sm"
    >
      <span className="text-sm font-medium">{field.name}</span>
      <div className="flex items-center gap-1">
        {widthKey && onWidthChange && (
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            value={localWidth}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setLocalWidth(raw);
              if (raw === '') return;
              const val = Math.max(0, Number(raw));
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => {
                onWidthChange(val);
              }, 500);
            }}
            disabled={isChangingWidth}
            className="h-8 w-20"
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleVisibility}
          disabled={isTogglingVisibility}
          title={isVisible ? 'Ocultar campo' : 'Mostrar campo'}
        >
          {isVisible ? (
            <EyeIcon className="h-4 w-4" />
          ) : (
            <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        {!isNative && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// --- Payload builder para campos de grupo ---

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

// --- GroupFieldManagementList ---

interface GroupFieldManagementListProps {
  table: ITable;
  groupSlug: string;
  visibilityKey: 'showInFilter' | 'showInForm' | 'showInDetail' | 'showInList';
  excludeNative?: boolean;
}

export function GroupFieldManagementList({
  table,
  groupSlug,
  visibilityKey,
  excludeNative,
}: GroupFieldManagementListProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const targetGroup = (table.groups ?? []).find((g) => g.slug === groupSlug);
  const groupFields = targetGroup?.fields ?? [];

  const order = groupFields.map((f) => f._id);

  const activeFields = groupFields.filter(
    (f) =>
      !f.trashed &&
      !(excludeNative && f.native) &&
      f.type !== E_FIELD_TYPE.TRASHED &&
      f.type !== E_FIELD_TYPE.TRASHED_AT,
  );

  const sorted = [...activeFields].sort((a, b) => {
    const idxA = order.indexOf(a._id);
    const idxB = order.indexOf(b._id);
    return (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB);
  });

  const [fields, setFields] = useState<Array<IField>>(sorted);
  const [hasChanges, setHasChanges] = useState(false);
  const [togglingFieldId, setTogglingFieldId] = useState<string | null>(null);
  const [changingWidthFieldId, setChangingWidthFieldId] = useState<
    string | null
  >(null);
  const [pendingWidthKey, setPendingWidthKey] = useState<
    'widthInForm' | 'widthInList' | null
  >(null);

  const widthKey: 'widthInForm' | 'widthInList' | undefined =
    visibilityKey === 'showInForm'
      ? 'widthInForm'
      : visibilityKey === 'showInList'
        ? 'widthInList'
        : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Reordenacao via table update
  const updateTable = useUpdateTable({
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.tables.detail(table.slug), data);
      toastSuccess('Ordem atualizada com sucesso');
      setHasChanges(false);
    },
    onError: () => {
      toastError('Erro ao atualizar ordem dos campos');
    },
  });

  // Usa endpoint especifico de group-fields
  const groupFieldUpdate = useGroupFieldUpdate({
    onSuccess: (response) => {
      setFields((prev) =>
        prev.map((f) => (f._id === response._id ? response : f)),
      );

      const visibilityLabels: Record<typeof visibilityKey, string> = {
        showInList: 'listagem',
        showInFilter: 'filtros',
        showInForm: 'formulários',
        showInDetail: 'detalhes',
      };

      if (pendingWidthKey) {
        const widthValue = response[pendingWidthKey] ?? 'N/A';
        const unit = pendingWidthKey === 'widthInList' ? 'px' : '%';
        toastSuccess(`Largura atualizada para ${widthValue}${unit}`);
      } else {
        const visibilityLabel = visibilityLabels[visibilityKey];
        toastSuccess(
          response[visibilityKey]
            ? `Campo visível em ${visibilityLabel}`
            : `Campo oculto em ${visibilityLabel}`,
        );
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

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  }

  function handleSave(): void {
    const updatedGroups = table.groups.map((g) => {
      if (g.slug === groupSlug) {
        const trashedFields = g.fields.filter((f) => f.trashed);
        return {
          ...g,
          fields: [...fields, ...trashedFields].map((f) => ({ _id: f._id })),
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

  function handleEditField(fieldId: string): void {
    router.navigate({
      to: '/tables/$slug/field/$fieldId',
      params: { slug: table.slug, fieldId },
      search: { group: groupSlug },
    });
  }

  function handleToggleVisibility(field: IField): void {
    const currentValue = field[visibilityKey];
    setTogglingFieldId(field._id);
    groupFieldUpdate.mutate({
      tableSlug: table.slug,
      groupSlug,
      fieldId: field._id,
      data: buildGroupFieldPayload(field, groupSlug, {
        [visibilityKey]: !currentValue,
      }),
    });
  }

  function handleWidthChange(field: IField, newWidth: number): void {
    if (!widthKey) return;
    setChangingWidthFieldId(field._id);
    setPendingWidthKey(widthKey);
    groupFieldUpdate.mutate({
      tableSlug: table.slug,
      groupSlug,
      fieldId: field._id,
      data: buildGroupFieldPayload(field, groupSlug, { [widthKey]: newWidth }),
    });
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.map((field) => (
              <SortableGroupFieldItem
                key={field._id}
                field={field}
                disabled={updateTable.isPending}
                visibilityKey={visibilityKey}
                widthKey={widthKey}
                onEdit={() => handleEditField(field._id)}
                onToggleVisibility={() => handleToggleVisibility(field)}
                onWidthChange={
                  widthKey
                    ? (width): void => handleWidthChange(field, width)
                    : undefined
                }
                isTogglingVisibility={togglingFieldId === field._id}
                isChangingWidth={changingWidthFieldId === field._id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {fields.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Nenhum campo cadastrado
        </p>
      )}

      {hasChanges && (
        <Button
          className="w-full"
          disabled={!hasChanges || updateTable.isPending}
          onClick={handleSave}
        >
          {updateTable.isPending && (
            <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
          )}
          Salvar ordem
        </Button>
      )}
    </div>
  );
}

// --- GroupTrashedFieldsList ---

interface GroupTrashedFieldsListProps {
  table: ITable;
  groupSlug: string;
  excludeNative?: boolean;
}

export function GroupTrashedFieldsList({
  table,
  groupSlug,
  excludeNative,
}: GroupTrashedFieldsListProps): React.JSX.Element | null {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);

  const targetGroup = (table.groups ?? []).find((g) => g.slug === groupSlug);
  const groupFields = targetGroup?.fields ?? [];
  const trashedFields = groupFields.filter(
    (f) => f.trashed && !(excludeNative && f.native),
  );

  const deleteMutation = useMutation({
    mutationFn: async (field: IField) => {
      const route = `/tables/${table.slug}/fields/${field._id}?group=${groupSlug}`;
      await API.delete(route);
    },
    onMutate: (field) => {
      setDeletingFieldId(field._id);
    },
    onSuccess: (_, field) => {
      queryClient.setQueryData<ITable>(
        queryKeys.tables.detail(table.slug),
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
              if (t.slug !== table.slug) return t;
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

  if (trashedFields.length === 0) {
    return null;
  }

  function handleEditField(fieldId: string): void {
    router.navigate({
      to: '/tables/$slug/field/$fieldId',
      params: { slug: table.slug, fieldId },
      search: { group: groupSlug },
    });
  }

  return (
    <div className="space-y-2">
      {trashedFields.map((field) => (
        <div
          key={field._id}
          className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3"
        >
          <span className="text-sm text-muted-foreground">{field.name}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEditField(field._id)}
              disabled={deletingFieldId === field._id}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => deleteMutation.mutate(field)}
              disabled={deletingFieldId === field._id}
              title="Excluir permanentemente"
            >
              {deletingFieldId === field._id ? (
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2Icon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
