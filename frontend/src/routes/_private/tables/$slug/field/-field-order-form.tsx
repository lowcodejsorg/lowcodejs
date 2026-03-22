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
import { useUpdateTable } from '@/hooks/tanstack-query/use-table-update';
import { API } from '@/lib/api';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, ITable, Paginated } from '@/lib/interfaces';
import { toastError, toastSuccess } from '@/lib/toast';

interface SortableItemProps {
  field: IField;
  disabled?: boolean;
  onEdit: () => void;
}

function SortableItem({
  field,
  disabled,
  onEdit,
}: SortableItemProps): React.JSX.Element {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 shadow-sm"
    >
      <span className="text-sm font-medium">{field.name}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
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

interface SortableManagementItemProps {
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

function SortableManagementItem({
  field,
  disabled,
  visibilityKey,
  widthKey,
  onEdit,
  onToggleVisibility,
  onWidthChange,
  isTogglingVisibility,
  isChangingWidth,
}: SortableManagementItemProps): React.JSX.Element {
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

  // Sync local state when the field value changes externally (e.g. after API response)
  useEffect(() => {
    setLocalWidth(String(currentWidth ?? 0));
  }, [currentWidth]);

  // Cleanup debounce on unmount
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

interface TrashedItemProps {
  field: IField;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

function TrashedItem({
  field,
  onEdit,
  onDelete,
  isDeleting,
}: TrashedItemProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3">
      <span className="text-sm text-muted-foreground">{field.name}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          disabled={isDeleting}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={isDeleting}
          title="Excluir permanentemente"
        >
          {isDeleting ? (
            <LoaderCircleIcon className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2Icon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface FieldOrderFormProps {
  table: ITable;
  reference: 'orderList' | 'orderForm';
  onSuccess?: () => void;
}

export function FieldOrderForm({
  table,
  reference,
  onSuccess,
}: FieldOrderFormProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const order =
    reference === 'orderList' ? table.fieldOrderList : table.fieldOrderForm;

  const activeFields = table.fields.filter((f) => !f.trashed);

  const sorted = [...activeFields].sort((a, b) => {
    const idxA = order.indexOf(a._id);
    const idxB = order.indexOf(b._id);
    return (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB);
  });

  const [fields, setFields] = useState<Array<IField>>(sorted);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const update = useUpdateTable({
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.tables.detail(table.slug), data);
      toastSuccess('Ordem atualizada com sucesso');
      setHasChanges(false);
      onSuccess?.();
    },
    onError: () => {
      toastError('Erro ao atualizar ordem dos campos');
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
    const newOrder = fields.flatMap((f) => f._id);
    update.mutate({
      slug: table.slug,
      name: table.name,
      description: table.description,
      logo: table.logo?._id ?? null,
      visibility: table.visibility,
      style: table.style,
      collaboration: table.collaboration,
      fieldOrderList:
        reference === 'orderList' ? newOrder : table.fieldOrderList,
      fieldOrderForm:
        reference === 'orderForm' ? newOrder : table.fieldOrderForm,
      administrators: table.administrators.flatMap((admin) => admin._id),
      fields: fields.flatMap((f) => f._id),
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
              <SortableItem
                key={field._id}
                field={field}
                disabled={update.isPending}
                onEdit={() => handleEditField(field._id)}
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
          disabled={!hasChanges || update.isPending}
          onClick={handleSave}
        >
          {update.isPending && (
            <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
          )}
          Salvar ordem
        </Button>
      )}
    </div>
  );
}

interface FieldManagementListProps {
  table: ITable;
  visibilityKey: 'showInFilter' | 'showInForm' | 'showInDetail' | 'showInList';
  excludeNative?: boolean;
}

export function FieldManagementList({
  table,
  visibilityKey,
  excludeNative,
}: FieldManagementListProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const order =
    visibilityKey === 'showInForm'
      ? table.fieldOrderForm
      : table.fieldOrderList;

  const activeFields = table.fields.filter(
    (f) =>
      !f.trashed &&
      !(excludeNative && f.native) &&
      // [TASK] Ocultar campos "Lixeira" e "Enviado para lixeira em" da tela Gerenciar Campos
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

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({
      field,
      newValue,
    }: {
      field: IField;
      newValue: boolean;
    }) => {
      const route = `/tables/${table.slug}/fields/${field._id}`;

      const hasRelationship = field.relationship !== null;
      const hasDropdown = field.dropdown.length > 0;
      const hasCategory = field.category.length > 0;

      const response = await API.put<IField>(route, {
        name: field.name,
        type: field.type,
        required: field.required,
        multiple: field.multiple,
        showInFilter:
          visibilityKey === 'showInFilter' ? newValue : field.showInFilter,
        showInForm:
          visibilityKey === 'showInForm' ? newValue : field.showInForm,
        showInDetail:
          visibilityKey === 'showInDetail' ? newValue : field.showInDetail,
        showInList:
          visibilityKey === 'showInList' ? newValue : field.showInList,
        widthInForm: field.widthInForm,
        widthInList: field.widthInList,
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
      });
      return response.data;
    },
    onMutate: ({ field }) => {
      setTogglingFieldId(field._id);
    },
    onSuccess: (response) => {
      setFields((prev) =>
        prev.map((f) => (f._id === response._id ? response : f)),
      );

      queryClient.setQueryData<IField>(
        queryKeys.fields.detail(table.slug, response._id),
        response,
      );

      queryClient.setQueryData<ITable>(
        queryKeys.tables.detail(table.slug),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: old.fields.map((f) =>
              f._id === response._id ? response : f,
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
              if (t.slug === table.slug) {
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

      const visibilityLabels: Record<typeof visibilityKey, string> = {
        showInList: 'listagem',
        showInFilter: 'filtros',
        showInForm: 'formulários',
        showInDetail: 'detalhes',
      };
      const visibilityLabel = visibilityLabels[visibilityKey];
      toastSuccess(
        response[visibilityKey]
          ? `Campo visível em ${visibilityLabel}`
          : `Campo oculto em ${visibilityLabel}`,
      );
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
      newWidth,
      targetWidthKey,
    }: {
      field: IField;
      newWidth: number;
      targetWidthKey: 'widthInForm' | 'widthInList';
    }) => {
      const route = `/tables/${table.slug}/fields/${field._id}`;

      const hasRelationship = field.relationship !== null;
      const hasDropdown = field.dropdown.length > 0;
      const hasCategory = field.category.length > 0;

      const response = await API.put<IField>(route, {
        name: field.name,
        type: field.type,
        required: field.required,
        multiple: field.multiple,
        showInFilter: field.showInFilter,
        showInForm: field.showInForm,
        showInDetail: field.showInDetail,
        showInList: field.showInList,
        widthInForm:
          targetWidthKey === 'widthInForm' ? newWidth : field.widthInForm,
        widthInList:
          targetWidthKey === 'widthInList' ? newWidth : field.widthInList,
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
      });
      return response.data;
    },
    onMutate: ({ field }) => {
      setChangingWidthFieldId(field._id);
    },
    onSuccess: (response) => {
      setFields((prev) =>
        prev.map((f) => (f._id === response._id ? response : f)),
      );

      queryClient.setQueryData<IField>(
        queryKeys.fields.detail(table.slug, response._id),
        response,
      );

      queryClient.setQueryData<ITable>(
        queryKeys.tables.detail(table.slug),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: old.fields.map((f) =>
              f._id === response._id ? response : f,
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
              if (t.slug === table.slug) {
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

      toastSuccess(
        `Largura atualizada para ${response[widthKey!]}${widthKey === 'widthInList' ? 'px' : '%'}`,
      );
    },
    onError: () => {
      toastError('Erro ao atualizar largura do campo');
    },
    onSettled: () => {
      setChangingWidthFieldId(null);
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
    updateTable.mutate({
      slug: table.slug,
      name: table.name,
      description: table.description,
      logo: table.logo?._id ?? null,
      visibility: table.visibility,
      style: table.style,
      collaboration: table.collaboration,
      fieldOrderList:
        visibilityKey === 'showInForm'
          ? table.fieldOrderList
          : fields.flatMap((f) => f._id),
      fieldOrderForm:
        visibilityKey === 'showInForm'
          ? fields.flatMap((f) => f._id)
          : table.fieldOrderForm,
      administrators: table.administrators.flatMap((admin) => admin._id),
      fields: fields.flatMap((f) => f._id),
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
    });
  }

  function handleToggleVisibility(field: IField): void {
    const currentValue = field[visibilityKey];
    toggleVisibilityMutation.mutate({
      field,
      newValue: !currentValue,
    });
  }

  function handleWidthChange(field: IField, newWidth: number): void {
    if (!widthKey) return;
    changeWidthMutation.mutate({
      field,
      newWidth,
      targetWidthKey: widthKey,
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
              <SortableManagementItem
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

interface TrashedFieldsListProps {
  table: ITable;
  excludeNative?: boolean;
}

export function TrashedFieldsList({
  table,
  excludeNative,
}: TrashedFieldsListProps): React.JSX.Element | null {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);

  const trashedFields = table.fields.filter(
    (f) => f.trashed && !(excludeNative && f.native),
  );

  const deleteMutation = useMutation({
    mutationFn: async (field: IField) => {
      const route = `/tables/${table.slug}/fields/${field._id}`;
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
              if (t.slug !== table.slug) return t;
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

  if (trashedFields.length === 0) {
    return null;
  }

  function handleEditField(fieldId: string): void {
    router.navigate({
      to: '/tables/$slug/field/$fieldId',
      params: { slug: table.slug, fieldId },
    });
  }

  return (
    <div className="space-y-2">
      {trashedFields.map((field) => (
        <TrashedItem
          key={field._id}
          field={field}
          onEdit={() => handleEditField(field._id)}
          onDelete={() => deleteMutation.mutate(field)}
          isDeleting={deletingFieldId === field._id}
        />
      ))}
    </div>
  );
}
