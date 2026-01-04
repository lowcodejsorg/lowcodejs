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
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { GripVerticalIcon, LoaderCircleIcon, PencilIcon } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useUpdateTable } from '@/hooks/tanstack-query/use-table-update';
import type { IField, ITable } from '@/lib/interfaces';

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
}

export function FieldOrderForm({
  table,
  reference,
  onSuccess,
}: FieldOrderFormProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const order = table.configuration.fields[reference];
  const activeFields = table.fields.filter((f) => !f.trashed);

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
    update.mutate({
      slug: table.slug,
      name: table.name,
      description: table.description,
      logo: table.logo?._id ?? null,
      configuration: {
        ...table.configuration,
        fields: {
          ...table.configuration.fields,
          [reference]: fields.map((f) => f._id),
        },
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

interface TrashedFieldsListProps {
  table: ITable;
}

export function TrashedFieldsList({
  table,
}: TrashedFieldsListProps): React.JSX.Element | null {
  const router = useRouter();
  const trashedFields = table.fields.filter((f) => f.trashed);

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
        />
      ))}
    </div>
  );
}
