import { useParams, useRouter } from '@tanstack/react-router';
import {
  BookOpenCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderTreeIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
  TagIcon,
  WorkflowIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
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
}: {
  nodes: Array<CatNode>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  openMap: Record<string, boolean>;
  toggleOpen: (id: string) => void;
  level?: number;
}): React.JSX.Element {
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
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

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
  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });
  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

  return (
    <div className="relative">
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
          <div className="p-2 space-y-2 overflow-auto h-full relative">
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
              <BookOpenCheckIcon className="size-4 opacity-70" />
              <span>Todas</span>
            </button>

            {/* Editar categoria */}
            {permission.can('UPDATE_FIELD') && (
              <div className="flex flex-row justify-end absolute top-3 right-4 z-10">
                <button
                  type="button"
                  className="p-0 cursor-pointer bg-muted rounded-md p-1 hover:bg-muted/60"
                  aria-label="Editar categoria"
                  onClick={() => {
                    router.navigate({
                      to: '/tables/$slug/field/$fieldId',
                      params: { slug, fieldId: categoryField._id },
                    });
                  }}
                >
                  <SettingsIcon className="size-4" />
                </button>
              </div>
            )}

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
