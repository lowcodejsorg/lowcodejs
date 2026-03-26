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
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  LoaderCircleIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import type {
  FieldManagementActions,
  VisibilityKey,
} from './field-management-context';
import {
  FieldManagementProvider,
  useFieldManagement,
} from './field-management-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField } from '@/lib/interfaces';

// --- Internal components ---

interface SortableManagementItemProps {
  field: IField;
  disabled?: boolean;
  visibilityKey: VisibilityKey;
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

  let opacityValue = 1;
  if (isDragging) {
    opacityValue = 0.5;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: opacityValue,
  };

  const isVisible = field[visibilityKey];
  let currentWidth: number | null = null;
  if (widthKey) {
    currentWidth = field[widthKey] ?? 50;
  }
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
      data-slot="sortable-management-item"
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
          title={(isVisible && 'Ocultar campo') || 'Mostrar campo'}
        >
          {isVisible && <EyeIcon className="h-4 w-4" />}
          {!isVisible && (
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
          {isDeleting && <LoaderCircleIcon className="h-4 w-4 animate-spin" />}
          {!isDeleting && <Trash2Icon className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// --- Compound Components ---

interface RootProps {
  actions: FieldManagementActions;
  children: React.ReactNode;
}

function FieldManagementRoot({
  actions,
  children,
}: RootProps): React.JSX.Element {
  return (
    <FieldManagementProvider value={actions}>
      <div className="flex flex-col h-full overflow-hidden">{children}</div>
    </FieldManagementProvider>
  );
}

interface HeaderProps {
  title: string;
  onBack: () => void;
}

function FieldManagementHeader({
  title,
  onBack,
}: HeaderProps): React.JSX.Element {
  return (
    <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
      <div className="inline-flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-xl font-medium">{title}</h1>
      </div>
    </div>
  );
}

function FieldManagementTabs(): React.JSX.Element {
  const { fields } = useFieldManagement();

  const nonNativeFields = fields.filter((f) => !f.native);
  const trashedCount = nonNativeFields.filter((f) => f.trashed).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto relative p-4">
      <Tabs
        defaultValue="display"
        className="w-full max-w-6xl mx-auto"
      >
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="display">Lista</TabsTrigger>
          <TabsTrigger value="filter">Filtros</TabsTrigger>
          <TabsTrigger value="form">Formulários</TabsTrigger>
          <TabsTrigger value="detail">Detalhes</TabsTrigger>
          <TabsTrigger
            value="trashed"
            disabled={trashedCount === 0}
          >
            Lixeira{trashedCount > 0 && ` (${trashedCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="display">
          <FieldManagementList visibilityKey="showInList" />
        </TabsContent>

        <TabsContent value="filter">
          <FieldManagementList
            visibilityKey="showInFilter"
            excludeNative
          />
        </TabsContent>

        <TabsContent value="form">
          <FieldManagementList
            visibilityKey="showInForm"
            excludeNative
          />
        </TabsContent>

        <TabsContent value="detail">
          <FieldManagementList visibilityKey="showInDetail" />
        </TabsContent>

        <TabsContent value="trashed">
          <FieldManagementTrashedList excludeNative />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ListProps {
  visibilityKey: VisibilityKey;
  excludeNative?: boolean;
}

function FieldManagementList({
  visibilityKey,
  excludeNative,
}: ListProps): React.JSX.Element {
  const {
    fields: allFields,
    onToggleVisibility,
    onChangeWidth,
    onSaveOrder,
    onEditField,
    togglingFieldId,
    changingWidthFieldId,
    isSavingOrder,
  } = useFieldManagement();

  const activeFields = allFields.filter(
    (f) =>
      !f.trashed &&
      !(excludeNative && f.native) &&
      f.type !== E_FIELD_TYPE.TRASHED &&
      f.type !== E_FIELD_TYPE.TRASHED_AT,
  );

  const [fields, setFields] = useState<Array<IField>>(activeFields);
  const [hasChanges, setHasChanges] = useState(false);

  let widthKey: 'widthInForm' | 'widthInList' | undefined;
  if (visibilityKey === 'showInForm') {
    widthKey = 'widthInForm';
  } else if (visibilityKey === 'showInList') {
    widthKey = 'widthInList';
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
    const orderedIds = fields.map((f) => f._id);
    onSaveOrder(visibilityKey, orderedIds);
    setHasChanges(false);
  }

  function handleToggleVisibility(field: IField): void {
    const currentValue = field[visibilityKey];
    onToggleVisibility(field, visibilityKey, !currentValue);
  }

  function handleWidthChange(field: IField, newWidth: number): void {
    if (!widthKey) return;
    onChangeWidth(field, widthKey, newWidth);
  }

  // Sync fields when context fields change (after mutation responses)
  useEffect(() => {
    const updated = allFields.filter(
      (f) =>
        !f.trashed &&
        !(excludeNative && f.native) &&
        f.type !== E_FIELD_TYPE.TRASHED &&
        f.type !== E_FIELD_TYPE.TRASHED_AT,
    );

    setFields((prev) =>
      prev.map((pf) => {
        const found = updated.find((uf) => uf._id === pf._id);
        if (found) return found;
        return pf;
      }),
    );
  }, [allFields, excludeNative]);

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
                disabled={isSavingOrder}
                visibilityKey={visibilityKey}
                widthKey={widthKey}
                onEdit={() => onEditField(field._id)}
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
          disabled={!hasChanges || isSavingOrder}
          onClick={handleSave}
        >
          {isSavingOrder && (
            <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
          )}
          Salvar ordem
        </Button>
      )}
    </div>
  );
}

interface TrashedListProps {
  excludeNative?: boolean;
}

function FieldManagementTrashedList({
  excludeNative,
}: TrashedListProps): React.JSX.Element | null {
  const { fields, onDeleteField, onEditField, deletingFieldId } =
    useFieldManagement();

  const trashedFields = fields.filter(
    (f) => f.trashed && !(excludeNative && f.native),
  );

  if (trashedFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {trashedFields.map((field) => (
        <TrashedItem
          key={field._id}
          field={field}
          onEdit={() => onEditField(field._id)}
          onDelete={() => onDeleteField(field)}
          isDeleting={deletingFieldId === field._id}
        />
      ))}
    </div>
  );
}

export const FieldManagement = {
  Root: FieldManagementRoot,
  Header: FieldManagementHeader,
  Tabs: FieldManagementTabs,
  List: FieldManagementList,
  TrashedList: FieldManagementTrashedList,
};
