import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderTreeIcon,
  ListTreeIcon,
  TagIcon,
  WorkflowIcon,
  ChevronLeftIcon,
} from 'lucide-react';
import type { CatNode } from '@/lib/document-helpers';

function buildParentMap(
  nodes: CatNode[],
  parentId: string | null,
  map: Map<string, string | null>,
) {
  for (const n of nodes) {
    map.set(n.id, parentId);
    if (n.children?.length) buildParentMap(n.children, n.id, map);
  }
  return map;
}

function getAncestors(id: string, parentMap: Map<string, string | null>) {
  const out: string[] = [];
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
}) {
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
}: {
  nodes: CatNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  openMap: Record<string, boolean>;
  toggleOpen: (id: string) => void;
  level?: number;
}) {
  return (
    <div className="space-y-1">
      {nodes.map((n) => {
        const hasChildren = !!n.children?.length;
        const isOpen = hasChildren ? !!openMap[n.id] : false;

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
}: {
  title?: string;
  subtitle?: string;
  nodes: CatNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}) {
  const parentMap = useMemo(
    () => buildParentMap(nodes, null, new Map()),
    [nodes],
  );

  // estado de colapso: { [idDoNode]: boolean }
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const toggleOpen = (id: string) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // auto-expande o caminho do item selecionado
  useEffect(() => {
    if (!selectedId) return;
    const ancestors = getAncestors(selectedId, parentMap);
    if (!ancestors.length) return;

    setOpenMap((prev) => {
      const next = { ...prev };
      for (const a of ancestors) next[a] = true;
      // abre também o próprio se tiver filhos
      next[selectedId] = true;
      return next;
    });
  }, [selectedId, parentMap]);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="p-2 rounded cursor-pointer absolute top-2 right-1"
      >
        {isOpen ? (
          <ChevronLeftIcon className="size-5" />
        ) : (
          <ChevronRightIcon className="size-5" />
        )}
      </button>
      <aside
        className={[
          'fixed md:static left-0 top-0 bottom-0 z-40 bg-background border-r h-full',
          'transition-all duration-300',
          isOpen ? 'w-72' : 'w-10',
        ].join(' ')}
      >
        {isOpen && (
          <div className="p-3 border-b flex items-center justify-between">
            <div className="text-sm font-medium">{title}</div>
          </div>
        )}

        {isOpen && (
          <div className="p-2 space-y-2 overflow-auto h-full">
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={[
                'w-full text-left rounded-md px-2 py-1.5 text-sm transition',
                'flex items-center gap-2 cursor-pointer',
                selectedId === null
                  ? 'bg-muted font-medium'
                  : 'hover:bg-muted/60',
              ].join(' ')}
            >
              <FolderIcon className="size-4 opacity-70" />
              <span>Todas</span>
            </button>

            <Tree
              nodes={nodes}
              selectedId={selectedId}
              onSelect={onSelect}
              openMap={openMap}
              toggleOpen={toggleOpen}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
