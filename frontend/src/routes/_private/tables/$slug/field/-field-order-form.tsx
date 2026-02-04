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
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useUpdateTable } from '@/hooks/tanstack-query/use-table-update';
import { API } from '@/lib/api';
import type { IField, ITable, Paginated } from '@/lib/interfaces';

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
  visibilityKey: 'filter' | 'form' | 'detail' | 'display';
  onEdit: () => void;
  onToggleVisibility: () => void;
  isTogglingVisibility?: boolean;
}

function SortableManagementItem({
  field,
  disabled,
  visibilityKey,
  onEdit,
  onToggleVisibility,
  isTogglingVisibility,
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

  const isVisible = field.configuration[visibilityKey];

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

interface TrashedItemProps {
  field: IField;
  onEdit: () => void;
}

function TrashedItem({ field, onEdit }: TrashedItemProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3">
      <span className="text-sm text-muted-foreground">{field.name}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onEdit}
      >
        <PencilIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface FieldOrderFormProps {
  table: ITable;
  reference: 'orderList' | 'orderForm';
  onSuccess?: () => void;
  /** Se for contexto de grupo embedded */
  groupSlug?: string;
  /** Campos do grupo (quando em contexto de grupo) */
  groupFields?: Array<IField>;
}

export function FieldOrderForm({
  table,
  reference,
  onSuccess,
  groupSlug,
  groupFields,
}: FieldOrderFormProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isGroupContext = !!groupSlug && !!groupFields;

  // Para grupos, a ordem é simplesmente a ordem no array de campos
  // Para tabelas, usa configuration.fields[reference]
  const order = isGroupContext
    ? groupFields.map((f) => f._id)
    : table.configuration.fields[reference];

  const sourceFields = isGroupContext ? groupFields : table.fields;
  const activeFields = sourceFields.filter((f) => !f.trashed);

  const sorted = [...activeFields].sort(
    (a, b) => order.indexOf(a._id) - order.indexOf(b._id),
  );

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
      queryClient.setQueryData(
        ['/tables/'.concat(table.slug), table.slug],
        data,
      );
      toast.success('Ordem atualizada com sucesso');
      setHasChanges(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar ordem dos campos');
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
    // Para contexto de grupo, atualiza groups com a nova ordem
    if (isGroupContext && groupSlug) {
      const updatedGroups = table.groups.map((g) => {
        if (g.slug === groupSlug) {
          // Mantém campos trashed no final, mas atualiza a ordem dos ativos
          const trashedFields = g.fields.filter((f) => f.trashed);
          return {
            ...g,
            fields: [...fields, ...trashedFields],
          };
        }
        return g;
      });

      update.mutate({
        slug: table.slug,
        name: table.name,
        description: table.description,
        logo: table.logo?._id ?? null,
        configuration: {
          visibility: table.configuration.visibility,
          style: table.configuration.style,
          collaboration: table.configuration.collaboration,
          fields: table.configuration.fields,
          administrators: table.configuration.administrators.map((admin) =>
            typeof admin === 'string' ? admin : admin._id,
          ),
        },
        groups: updatedGroups,
        fields: table.fields.map((f) => f._id),
        methods: {
          ...table.methods,
          afterSave: table.methods.afterSave,
          beforeSave: table.methods.beforeSave,
          onLoad: table.methods.onLoad,
        },
      });
      return;
    }

    // Para tabelas normais, atualiza fields e configuration.fields
    update.mutate({
      slug: table.slug,
      name: table.name,
      description: table.description,
      logo: table.logo?._id ?? null,
      configuration: {
        visibility: table.configuration.visibility,
        style: table.configuration.style,
        collaboration: table.configuration.collaboration,
        fields: {
          ...table.configuration.fields,
          [reference]: fields.map((f) => f._id),
        },
        administrators: table.configuration.administrators.map((admin) =>
          typeof admin === 'string' ? admin : admin._id,
        ),
      },
      fields: fields.map((f) => f._id),
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
      search: groupSlug ? { group: groupSlug } : undefined,
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
    </div>
  );
}

interface FieldManagementListProps {
  table: ITable;
  visibilityKey: 'filter' | 'form' | 'detail' | 'display';
  /** Se for contexto de grupo embedded */
  groupSlug?: string;
  /** Campos do grupo (quando em contexto de grupo) */
  groupFields?: Array<IField>;
}

export function FieldManagementList({
  table,
  visibilityKey,
  groupSlug,
  groupFields,
}: FieldManagementListProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isGroupContext = !!groupSlug && !!groupFields;

  // Para grupos, a ordem é simplesmente a ordem no array de campos
  // Para tabelas, usa configuration.fields.orderList
  const order = isGroupContext
    ? groupFields.map((f) => f._id)
    : table.configuration.fields.orderList;

  const sourceFields = isGroupContext ? groupFields : table.fields;
  const activeFields = sourceFields.filter((f) => !f.trashed);

  const sorted = [...activeFields].sort(
    (a, b) => order.indexOf(a._id) - order.indexOf(b._id),
  );

  const [fields, setFields] = useState<Array<IField>>(sorted);
  const [hasChanges, setHasChanges] = useState(false);
  const [togglingFieldId, setTogglingFieldId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const updateTable = useUpdateTable({
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['/tables/'.concat(table.slug), table.slug],
        data,
      );
      toast.success('Ordem atualizada com sucesso');
      setHasChanges(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar ordem dos campos');
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
      const route = '/tables/'
        .concat(table.slug)
        .concat('/fields/')
        .concat(field._id);

      // Build full payload as API requires complete field data
      const hasRelationship = field.configuration.relationship !== null;
      const hasDropdown = field.configuration.dropdown.length > 0;
      const hasCategory = field.configuration.category.length > 0;

      const response = await API.put<IField>(route, {
        name: field.name,
        type: field.type,
        configuration: {
          required: field.configuration.required,
          multiple: field.configuration.multiple,
          filter:
            visibilityKey === 'filter' ? newValue : field.configuration.filter,
          form: visibilityKey === 'form' ? newValue : field.configuration.form,
          detail:
            visibilityKey === 'detail' ? newValue : field.configuration.detail,
          display:
            visibilityKey === 'display'
              ? newValue
              : field.configuration.display,
          format: field.configuration.format ?? null,
          defaultValue: field.configuration.defaultValue ?? null,
          dropdown: hasDropdown ? field.configuration.dropdown : [],
          relationship: hasRelationship
            ? {
                table: {
                  _id: field.configuration.relationship!.table._id,
                  slug: field.configuration.relationship!.table.slug,
                },
                field: {
                  _id: field.configuration.relationship!.field._id,
                  slug: field.configuration.relationship!.field.slug,
                },
                order: field.configuration.relationship!.order,
              }
            : null,
          group: null,
          category: hasCategory ? field.configuration.category : [],
        },
        trashed: field.trashed,
        trashedAt: field.trashedAt ?? null,
        group: groupSlug,
      });
      return response.data;
    },
    onMutate: ({ field }) => {
      setTogglingFieldId(field._id);
    },
    onSuccess: (response) => {
      // Update field in local state
      setFields((prev) =>
        prev.map((f) => (f._id === response._id ? response : f)),
      );

      // Update query cache for field
      queryClient.setQueryData<IField>(
        [
          '/tables/'.concat(table.slug).concat('/fields/').concat(response._id),
          response._id,
        ],
        response,
      );

      // Update table cache
      queryClient.setQueryData<ITable>(
        ['/tables/'.concat(table.slug), table.slug],
        (old) => {
          if (!old) return old;

          // Se for contexto de grupo, atualiza groups
          if (isGroupContext && groupSlug) {
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
          }

          return {
            ...old,
            fields: old.fields.map((f) =>
              f._id === response._id ? response : f,
            ),
          };
        },
      );

      // Update paginated table cache
      queryClient.setQueryData<Paginated<ITable>>(
        ['/tables/paginated', { page: 1, perPage: 50 }],
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((t) => {
              if (t.slug === table.slug) {
                if (isGroupContext && groupSlug) {
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
                }

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
        display: 'listagem',
        filter: 'filtros',
        form: 'formulários',
        detail: 'detalhes',
      };
      const visibilityLabel = visibilityLabels[visibilityKey];
      toast.success(
        response.configuration[visibilityKey]
          ? `Campo visível em ${visibilityLabel}`
          : `Campo oculto em ${visibilityLabel}`,
      );
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar visibilidade do campo');
    },
    onSettled: () => {
      setTogglingFieldId(null);
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
    // Para contexto de grupo, atualiza groups com a nova ordem
    if (isGroupContext && groupSlug) {
      const updatedGroups = table.groups.map((g) => {
        if (g.slug === groupSlug) {
          // Mantém campos trashed no final, mas atualiza a ordem dos ativos
          const trashedFields = g.fields.filter((f) => f.trashed);
          return {
            ...g,
            fields: [...fields, ...trashedFields],
          };
        }
        return g;
      });

      updateTable.mutate({
        slug: table.slug,
        name: table.name,
        description: table.description,
        logo: table.logo?._id ?? null,
        configuration: {
          visibility: table.configuration.visibility,
          style: table.configuration.style,
          collaboration: table.configuration.collaboration,
          fields: table.configuration.fields,
          administrators: table.configuration.administrators.map((admin) =>
            typeof admin === 'string' ? admin : admin._id,
          ),
        },
        groups: updatedGroups,
        fields: table.fields.map((f) => f._id),
        methods: {
          ...table.methods,
          afterSave: table.methods.afterSave,
          beforeSave: table.methods.beforeSave,
          onLoad: table.methods.onLoad,
        },
      });
      return;
    }

    // Para tabelas normais, atualiza fields e configuration.fields
    updateTable.mutate({
      slug: table.slug,
      name: table.name,
      description: table.description,
      logo: table.logo?._id ?? null,
      configuration: {
        visibility: table.configuration.visibility,
        style: table.configuration.style,
        collaboration: table.configuration.collaboration,
        fields: {
          ...table.configuration.fields,
          orderList: fields.map((f) => f._id),
        },
        administrators: table.configuration.administrators.map((admin) =>
          typeof admin === 'string' ? admin : admin._id,
        ),
      },
      fields: fields.map((f) => f._id),
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
      search: groupSlug ? { group: groupSlug } : undefined,
    });
  }

  function handleToggleVisibility(field: IField): void {
    const currentValue = field.configuration[visibilityKey];
    toggleVisibilityMutation.mutate({
      field,
      newValue: !currentValue,
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
                onEdit={() => handleEditField(field._id)}
                onToggleVisibility={() => handleToggleVisibility(field)}
                isTogglingVisibility={togglingFieldId === field._id}
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
    </div>
  );
}

interface TrashedFieldsListProps {
  table: ITable;
  /** Se for contexto de grupo embedded */
  groupSlug?: string;
  /** Campos do grupo (quando em contexto de grupo) */
  groupFields?: Array<IField>;
}

export function TrashedFieldsList({
  table,
  groupSlug,
  groupFields,
}: TrashedFieldsListProps): React.JSX.Element | null {
  const router = useRouter();

  const isGroupContext = !!groupSlug && !!groupFields;
  const sourceFields = isGroupContext ? groupFields : table.fields;
  const trashedFields = sourceFields.filter((f) => f.trashed);

  if (trashedFields.length === 0) {
    return null;
  }

  function handleEditField(fieldId: string): void {
    router.navigate({
      to: '/tables/$slug/field/$fieldId',
      params: { slug: table.slug, fieldId },
      search: groupSlug ? { group: groupSlug } : undefined,
    });
  }

  return (
    <div className="space-y-2">
      {trashedFields.map((field) => (
        <TrashedItem
          key={field._id}
          field={field}
          onEdit={() => handleEditField(field._id)}
        />
      ))}
    </div>
  );
}
