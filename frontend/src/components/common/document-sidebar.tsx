import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import {
  BookOpenCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderTreeIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SettingsIcon,
  TagIcon,
  WorkflowIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { API } from '@/lib/api';
import { E_FIELD_TYPE } from '@/lib/constant';
import { buildLabelMap } from '@/lib/document-helpers';
import type { CatNode } from '@/lib/document-helpers';
import type { IField } from '@/lib/interfaces';

function buildParentMap(
  nodes: Array<CatNode>,
  parentId: string | null,
  map: Map<string, string | null>,
): Map<string, string | null> {
  for (const n of nodes) {
    map.set(n.id, parentId);
    if (n.children?.length) buildParentMap(n.children, n.id, map);
  }
  return map;
}

function getAncestors(
  id: string,
  parentMap: Map<string, string | null>,
): Array<string> {
  const out: Array<string> = [];
  let cur: string | null | undefined = id;
  while (cur) {
    const p = parentMap.get(cur);
    if (!p) break;
    out.push(p);
    cur = p;
  }
  return out;
}

function TreeItem({
  node,
  level,
  selectedId,
  onSelect,
  isOpen,
  toggleOpen,
}: {
  node: CatNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isOpen: boolean;
  toggleOpen: (id: string) => void;
}): React.JSX.Element {
  const hasChildren = !!node.children?.length;
  const active = selectedId === node.id;

  return (
    <div>
      <div
        className={[
          'w-full rounded-md px-2 py-1.5 text-sm transition',
          'flex items-center gap-2',
          active ? 'bg-muted font-medium' : 'hover:bg-muted/60',
        ].join(' ')}
        style={{ paddingLeft: 8 + level * 12 }}
      >
        {/* Toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggleOpen(node.id)}
            className="p-0.5 rounded hover:bg-background/60 cursor-pointer"
            aria-label={isOpen ? 'Recolher' : 'Expandir'}
          >
            {isOpen ? (
              <ChevronDownIcon className="size-4 opacity-70" />
            ) : (
              <ChevronRightIcon className="size-4 opacity-70" />
            )}
          </button>
        ) : (
          <span className="w-[22px]" />
        )}

        {/* Icon */}
        {hasChildren ? (
          <FolderIcon className="size-4 opacity-70" />
        ) : (
          <TagIcon className="size-4 opacity-70" />
        )}

        {/* Select */}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex-1 text-left truncate"
          title={node.label}
        >
          {node.label}
        </button>
      </div>

      {/* children */}
      {hasChildren && isOpen ? (
        <div className="mt-1 space-y-1">
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              isOpen={isOpen}
              toggleOpen={toggleOpen}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Render recursivo com estado de openMap
 */
function Tree({
  nodes,
  selectedId,
  onSelect,
  openMap,
  toggleOpen,
  level = 0,
  onAddChild,
  canAdd = false,
}: {
  nodes: Array<CatNode>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  openMap: Record<string, boolean>;
  toggleOpen: (id: string) => void;
  level?: number;
  onAddChild?: (id: string) => void;
  canAdd?: boolean;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      {nodes.map((n) => {
        const hasChildren = !!n.children?.length;
        const isOpen = hasChildren ? !!openMap[n.id] : false;
        const showAdd = canAdd && onAddChild;

        return (
          <div key={n.id}>
            <div
              className={[
                'w-full rounded-md px-2 py-1.5 text-sm transition',
                'flex items-center gap-2',
                selectedId === n.id
                  ? 'bg-muted font-medium'
                  : 'hover:bg-muted/60',
              ].join(' ')}
              style={{ paddingLeft: 8 + level * 12 }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleOpen(n.id)}
                  className="p-0.5 rounded hover:bg-background/60 cursor-pointer"
                  aria-label={isOpen ? 'Recolher' : 'Expandir'}
                >
                  {isOpen ? (
                    <ChevronDownIcon className="size-4 opacity-70" />
                  ) : (
                    <ChevronRightIcon className="size-4 opacity-70" />
                  )}
                </button>
              ) : (
                <span className="w-[22px]" />
              )}

              {hasChildren ? (
                <FolderTreeIcon className="size-4 opacity-70" />
              ) : (
                <WorkflowIcon className="size-4 opacity-70" />
              )}

              <button
                type="button"
                onClick={() => onSelect(n.id)}
                className="flex-1 text-left truncate cursor-pointer"
                title={n.label}
              >
                {n.label}
              </button>

              {showAdd && (
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-background/60 cursor-pointer"
                  aria-label="Adicionar sub-item"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddChild(n.id);
                  }}
                >
                  <PlusIcon className="size-4 opacity-70" />
                </button>
              )}
            </div>

            {hasChildren && isOpen ? (
              <div className="mt-1">
                <Tree
                  nodes={n.children!}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  openMap={openMap}
                  toggleOpen={toggleOpen}
                  level={level + 1}
                  onAddChild={onAddChild}
                  canAdd={canAdd}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

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
  const parentMap = useMemo(
    () => buildParentMap(nodes, null, new Map()),
    [nodes],
  );
  const labelMap = useMemo(() => buildLabelMap(nodes), [nodes]);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');

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
                  onClick={() => onSelect(null)}
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

            <Tree
              nodes={nodes}
              selectedId={selectedId}
              onSelect={onSelect}
              openMap={openMap}
              toggleOpen={toggleOpen}
              onAddChild={handleOpenAdd}
              canAdd={!!canManageCategory}
            />
          </div>
        )}
      </aside>

      <Dialog
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) {
            setNewLabel('');
            setAddParentId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova seção</DialogTitle>
            <DialogDescription>
              {parentLabel
                ? `Criar seção dentro de "${parentLabel}".`
                : 'Criar seção na raiz.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="Nome da seção"
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              disabled={addCategory.status === 'pending'}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => handleCreateCategory()}
              disabled={!newLabel.trim() || addCategory.status === 'pending'}
            >
              {addCategory.status === 'pending' && <Spinner />}
              <span>Criar</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
