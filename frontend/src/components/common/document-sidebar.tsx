import type {
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import {
  BookOpenCheckIcon,
  GripVerticalIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SettingsIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DocumentSidebarAddDialog } from '@/components/common/document-sidebar-add-dialog';
import {
  buildParentMap,
  findNodeAndRemove,
  findNodeByIdLocal,
  getAncestors,
  getDropMode,
  insertNodeAt,
  isDescendant,
  reorderInTree,
  updateNodeLabel,
} from '@/components/common/document-sidebar-helpers';
import type { DropMode } from '@/components/common/document-sidebar-helpers';
import { DocumentSidebarTree } from '@/components/common/document-sidebar-tree';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { API } from '@/lib/api';
import { E_FIELD_TYPE } from '@/lib/constant';
import { buildLabelMap } from '@/lib/document-helpers';
import type { CatNode } from '@/lib/document-helpers';
import type { IField } from '@/lib/interfaces';

export function DocumentSidebar({
  title = 'Índice',
  subtitle,
  nodes,
  selectedId,
  onSelect,
  isOpen,
  onToggle,
  categoryField,
}: {
  title?: string;
  subtitle?: string;
  nodes: Array<CatNode>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isOpen: boolean;
  onToggle: () => void;
  categoryField: IField;
}): React.JSX.Element {
  const [treeNodes, setTreeNodes] = useState<Array<CatNode>>(nodes);
  const parentMap = useMemo(
    () => buildParentMap(treeNodes, null, new Map()),
    [treeNodes],
  );
  const labelMap = useMemo(() => buildLabelMap(treeNodes), [treeNodes]);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [dragEnabledId, setDragEnabledId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverMode, setDragOverMode] = useState<DropMode>(null);
  const rootDropId = 'document-sidebar-root';
  const { setNodeRef: setRootDropRef, isOver: isOverRoot } = useDroppable({
    id: rootDropId,
    data: { parentId: null },
  });

  useEffect(() => {
    setTreeNodes(nodes);
  }, [nodes]);

  useEffect((): void | (() => void) => {
    if (!dragEnabledId) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setDragEnabledId(null);
        cancelEdit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dragEnabledId]);

  const toggleOpen = (id: string): void => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!selectedId) return;
    const ancestors = getAncestors(selectedId, parentMap);
    if (!ancestors.length) return;

    setOpenMap((prev) => {
      const next = { ...prev };
      for (const a of ancestors) next[a] = true;
      next[selectedId] = true;
      return next;
    });
  }, [selectedId, parentMap]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });
  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

  const canManageCategory =
    permission.can('UPDATE_FIELD') &&
    categoryField._id &&
    categoryField.type === E_FIELD_TYPE.CATEGORY;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const addCategory = useMutation({
    mutationFn: async (payload: { label: string; parentId: string | null }) => {
      const route = `/tables/${slug}/fields/${categoryField._id}/category`;
      const response = await API.post<{
        node: { id: string; label: string; parentId: string | null };
        field: IField;
      }>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: ['/tables/'.concat(slug), slug],
      });

      toast('Seção criada', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A seção foi criada com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      setAddModalOpen(false);
      setNewLabel('');

      router.navigate({
        to: '/tables/$slug/row/create',
        params: { slug },
        search: {
          categoryId: data.node.id,
          categorySlug: categoryField.slug,
        },
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        toast('Erro ao criar seção', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao criar seção',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
      console.error(error);
    },
  });

  const handleOpenAdd = (parentId: string | null): void => {
    if (!canManageCategory) return;
    setAddParentId(parentId);
    setNewLabel('');
    setAddModalOpen(true);
  };

  const updateCategoryTree = useMutation({
    mutationFn: async (category: Array<CatNode>) => {
      const route = `/tables/${slug}/fields/${categoryField._id}`;
      const response = await API.put<IField>(route, {
        name: categoryField.name,
        type: categoryField.type,
        configuration: {
          required: categoryField.configuration.required,
          multiple: categoryField.configuration.multiple,
          listing: categoryField.configuration.listing,
          filtering: categoryField.configuration.filtering,
          format: categoryField.configuration.format,
          defaultValue: categoryField.configuration.defaultValue,
          dropdown: categoryField.configuration.dropdown,
          relationship: categoryField.configuration.relationship,
          group: null,
          category,
        },
        trashed: categoryField.trashed,
        trashedAt: categoryField.trashedAt,
      });
      return response.data;
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ['/tables/'.concat(slug), slug],
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        toast('Erro ao atualizar categorias', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao atualizar categorias',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
      console.error(error);
    },
  });

  const startEdit = (nodeId: string, label: string): void => {
    if (!canManageCategory) return;
    setEditingNodeId(nodeId);
    setEditingLabel(label);
    setDragEnabledId(nodeId);
  };

  const cancelEdit = (): void => {
    setEditingNodeId(null);
    setEditingLabel('');
  };

  const saveEdit = async (): Promise<void> => {
    if (!editingNodeId) return;
    const label = editingLabel.trim();
    if (!label) {
      cancelEdit();
      return;
    }

    const currentNode = findNodeByIdLocal(treeNodes, editingNodeId);
    if (currentNode?.label === label) {
      cancelEdit();
      return;
    }

    const previous = treeNodes;
    const updated = updateNodeLabel(treeNodes, editingNodeId, label);
    setTreeNodes(updated);
    setEditingNodeId(null);
    setEditingLabel('');

    try {
      await updateCategoryTree.mutateAsync(updated);
    } catch {
      setTreeNodes(previous);
    }
  };

  const handleDragStart = (event: DragStartEvent): void => {
    if (!dragEnabledId || !canManageCategory) return;
    if (String(event.active.id) !== dragEnabledId) return;
  };

  const handleDragOver = (event: DragOverEvent): void => {
    if (!dragEnabledId || !canManageCategory) return;
    const { active, over } = event;
    if (!over) {
      setDragOverId(null);
      setDragOverMode(null);
      return;
    }

    if (over.id === rootDropId) {
      setDragOverId(null);
      setDragOverMode(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    if (
      isDescendant(treeNodes, activeId, overId) ||
      (over.data.current?.parentId &&
        isDescendant(treeNodes, activeId, String(over.data.current.parentId)))
    ) {
      setDragOverId(null);
      setDragOverMode(null);
      return;
    }

    const mode = getDropMode(event);
    setDragOverId(overId);
    setDragOverMode(mode);
  };

  const handleDragCancel = (_event: DragCancelEvent): void => {
    setDragOverId(null);
    setDragOverMode(null);
  };

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    if (!dragEnabledId || !canManageCategory) return;
    const { active, over } = event;
    setDragOverId(null);
    setDragOverMode(null);
    if (!over || active.id === over.id) return;

    const activeParentId =
      (active.data.current?.parentId as string | null | undefined) ?? null;
    const overParentId =
      (over.data.current?.parentId as string | null | undefined) ?? null;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (over.id === rootDropId) {
      if (activeParentId === null) return;
      const { updated, removed } = findNodeAndRemove(treeNodes, activeId);
      if (!removed) return;
      const next = insertNodeAt(updated, null, updated.length, removed);
      const previous = treeNodes;
      setTreeNodes(next);
      try {
        await updateCategoryTree.mutateAsync(next);
      } catch {
        setTreeNodes(previous);
      }
      return;
    }

    if (
      (overParentId && isDescendant(treeNodes, activeId, overParentId)) ||
      isDescendant(treeNodes, activeId, overId)
    ) {
      return;
    }

    const computedMode = getDropMode(event);
    const shouldNest = computedMode === 'nest';

    let next = treeNodes;

    if (activeParentId === overParentId) {
      if (shouldNest) {
        if (activeId !== overId) {
          const { updated, removed } = findNodeAndRemove(treeNodes, activeId);
          if (!removed) return;
          const targetNode = findNodeByIdLocal(updated, overId);
          const childIndex = targetNode?.children?.length ?? 0;
          next = insertNodeAt(updated, overId, childIndex, removed);
        }
      } else {
        next = reorderInTree(treeNodes, activeParentId, activeId, overId);
      }
    } else {
      const { updated, removed } = findNodeAndRemove(treeNodes, activeId);
      if (!removed) return;

      if (shouldNest) {
        const targetNode = findNodeByIdLocal(updated, overId);
        const childIndex = targetNode?.children?.length ?? 0;
        next = insertNodeAt(updated, overId, childIndex, removed);
      } else {
        const targetList =
          overParentId === null
            ? updated
            : (findNodeByIdLocal(updated, overParentId)?.children ?? []);
        const insertIndex = targetList.findIndex((item) => item.id === overId);
        const nextIndex = insertIndex === -1 ? targetList.length : insertIndex;

        next = insertNodeAt(updated, overParentId, nextIndex, removed);
      }
    }

    if (next === treeNodes) return;
    const previous = treeNodes;
    setTreeNodes(next);
    try {
      await updateCategoryTree.mutateAsync(next);
    } catch {
      setTreeNodes(previous);
    }
  };

  const handleCreateCategory = async (): Promise<void> => {
    if (!canManageCategory) return;
    const label = newLabel.trim();
    if (!label) return;
    if (addCategory.status === 'pending') return;

    await addCategory.mutateAsync({
      label,
      parentId: addParentId,
    });
  };

  const parentLabel =
    addParentId && labelMap.get(addParentId) ? labelMap.get(addParentId) : null;

  return (
    <div className="relative">
      <aside
        className={[
          'fixed left-0 top-0 bottom-0 z-40 bg-background border-r h-svh flex flex-col relative md:sticky md:top-0 md:h-full md:inset-auto md:z-0',
          'transition-all duration-300',
          isOpen ? 'w-72' : 'w-10',
        ].join(' ')}
      >
        <button
          onClick={onToggle}
          className="p-2 rounded cursor-pointer absolute top-2 right-1"
        >
          {isOpen ? (
            <PanelLeftCloseIcon className="size-5" />
          ) : (
            <PanelLeftOpenIcon className="size-5" />
          )}
        </button>
        {isOpen && (
          <div className="p-3 border-b flex items-center justify-between">
            <div className="text-sm font-medium">{title}</div>
          </div>
        )}

        {isOpen && (
          <div className="p-2 space-y-2 overflow-auto flex-1 min-h-0 relative">
            {dragEnabledId && (
              <div className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground flex items-center gap-2">
                <GripVerticalIcon className="size-3.5" />
                <span>
                  Modo organização ativo — arraste pelo ícone e pressione Esc
                  para sair
                </span>
              </div>
            )}
            <div
              className={[
                'w-full rounded-md px-2 py-1.5 text-sm transition',
                'flex items-center gap-2',
                selectedId === null
                  ? 'bg-muted font-medium'
                  : 'hover:bg-muted/60',
              ].join(' ')}
            >
              <div className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDragEnabledId(null);
                    cancelEdit();
                    onSelect(null);
                  }}
                  className="flex items-center gap-2 truncate cursor-pointer"
                >
                  <BookOpenCheckIcon className="size-4 opacity-70" />
                  <span>Todas</span>
                </button>
                {permission.can('UPDATE_FIELD') && (
                  <button
                    type="button"
                    className="p-0.5 rounded hover:bg-background/60 cursor-pointer"
                    aria-label="Editar categoria"
                    onClick={() => {
                      router.navigate({
                        to: '/tables/$slug/field/$fieldId',
                        params: { slug, fieldId: categoryField._id },
                      });
                    }}
                  >
                    <SettingsIcon className="size-4 opacity-70" />
                  </button>
                )}
              </div>

              {canManageCategory && (
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-background/60 cursor-pointer"
                  aria-label="Adicionar sessão na raiz"
                  onClick={() => handleOpenAdd(null)}
                >
                  <PlusIcon className="size-4 opacity-70" />
                </button>
              )}
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragOver={handleDragOver}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div
                ref={setRootDropRef}
                className={
                  isOverRoot
                    ? 'rounded-md ring-1 ring-primary/40 bg-primary/5'
                    : undefined
                }
              >
                <DocumentSidebarTree
                  nodes={treeNodes}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setDragEnabledId(null);
                    cancelEdit();
                    onSelect(id);
                  }}
                  openMap={openMap}
                  toggleOpen={toggleOpen}
                  onAddChild={handleOpenAdd}
                  canAdd={!!canManageCategory}
                  editingNodeId={editingNodeId}
                  editingLabel={editingLabel}
                  onEditLabelChange={setEditingLabel}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  dragEnabledId={dragEnabledId}
                  dragMode={!!dragEnabledId}
                  dragOverId={dragOverId}
                  dragOverMode={dragOverMode}
                  parentId={null}
                />
              </div>
            </DndContext>
          </div>
        )}
      </aside>

      <DocumentSidebarAddDialog
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) {
            setNewLabel('');
            setAddParentId(null);
          }
        }}
        parentLabel={parentLabel}
        value={newLabel}
        onValueChange={setNewLabel}
        onCancel={() => setAddModalOpen(false)}
        onSubmit={handleCreateCategory}
        isPending={addCategory.status === 'pending'}
      />
    </div>
  );
}
