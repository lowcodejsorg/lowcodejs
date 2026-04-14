---
name: maiyu:frontend-tree-navigation
description: |
  Generates hierarchical navigation components for frontend projects.
  Use when: user asks to create menu, sidebar menu, tree navigation, hierarchical menu,
  nested menu, drag-and-drop menu, or mentions "tree" or "menu" for navigation structures.
  Supports: dnd-kit for reordering, recursive rendering, multiple item types.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Framework**: `@tanstack/react-start` | `@tanstack/react-router` | `next` | `@remix-run/react` | `react`
   - **DnD library**: `@dnd-kit/core` | `@dnd-kit/sortable` | `@dnd-kit/utilities`
   - **Router**: `@tanstack/react-router` | `next/navigation` | `@remix-run/react` | `react-router-dom`
   - **Icons**: `lucide-react` | `@heroicons/react` | `react-icons`
   - **UI lib**: `@radix-ui/*` | `@headlessui/react`
3. Scan existing navigation/menu components to detect:
   - Component location (`src/components/common/`, `src/components/`)
   - Naming convention (kebab-case files, PascalCase exports)
   - Existing menu patterns or sidebar implementations
4. If dnd-kit is not installed and drag-and-drop is needed, instruct:
   ```
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

## Language Detection

Scan existing components and validation files for language:
- pt-BR indicators: "obrigatório", "nenhum", "Erro", "Carregando"
- en indicators: "required", "none", "Error", "Loading"
- Match the detected language for any user-facing strings

## Conventions

### Naming
- File: `menu-tree.tsx` (tree renderer), `menu-item.tsx` (single item), `menu-types.ts` (types)
- Sidebar: `sidebar-menu.tsx`, `sidebar-layout.tsx`
- Tree editor: `tree-editor.tsx`, `tree-node.tsx`
- Export: named function (e.g., `MenuTree()`, `MenuItem()`)
- Props: `interface {ComponentName}Props` defined above function

### File Placement
- `src/components/common/menu/` (menu components)
- `src/components/common/tree-editor/` (tree editor components)
- `src/components/common/layout/` (sidebar layout)

### Rules
- Named exports only (no default exports)
- Explicit return type: `React.JSX.Element`
- Props interface directly above the component function
- No ternary operators — use if/else, early return, or helper functions
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains
- Use `data-slot` attribute on composable subcomponents
- Tailwind CSS for styling (no inline styles)
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Recursive rendering for nested items (not flat with indentation hacks)

## Templates

### Menu Item Types

```typescript
// menu-types.ts

export type MenuItemType = 'LINK' | 'PAGE' | 'RESOURCE' | 'EXTERNAL' | 'SEPARATOR' | 'GROUP';

export interface IMenuItem {
  id: string;
  name: string;
  slug: string;
  type: MenuItemType;
  icon?: string;
  url?: string; // for EXTERNAL
  html?: string; // for PAGE
  resourceId?: string; // for RESOURCE
  parentId?: string | null;
  children?: Array<IMenuItem>;
  order: number;
}

export interface IMenu {
  id: string;
  name: string;
  slug: string;
  items: Array<IMenuItem>;
}
```

### Hierarchical Menu Renderer

```tsx
// menu-tree.tsx

import { cn } from '@/lib/utils';
import { MenuItem } from './menu-item';
import type { IMenuItem } from './menu-types';

interface MenuTreeProps {
  items: Array<IMenuItem>;
  activeSlug?: string;
  userPermissions?: Array<string>;
  onItemClick?: (item: IMenuItem) => void;
  className?: string;
}

export function MenuTree({
  items,
  activeSlug,
  userPermissions,
  onItemClick,
  className,
}: MenuTreeProps): React.JSX.Element {
  function filterByPermission(menuItems: Array<IMenuItem>): Array<IMenuItem> {
    if (!userPermissions) {
      return menuItems;
    }

    return menuItems.filter((item) => {
      if (item.type === 'SEPARATOR') {
        return true;
      }
      if (item.type === 'RESOURCE' && item.resourceId) {
        return userPermissions.includes(item.resourceId);
      }
      return true;
    });
  }

  const visibleItems = filterByPermission(items);

  return (
    <nav data-slot="menu-tree" className={cn('flex flex-col gap-1', className)}>
      {visibleItems.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          activeSlug={activeSlug}
          userPermissions={userPermissions}
          onItemClick={onItemClick}
        />
      ))}
    </nav>
  );
}
```

```tsx
// menu-item.tsx

import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, GripVertical, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IMenuItem } from './menu-types';

interface MenuItemProps {
  item: IMenuItem;
  activeSlug?: string;
  userPermissions?: Array<string>;
  depth?: number;
  onItemClick?: (item: IMenuItem) => void;
}

export function MenuItem({
  item,
  activeSlug,
  userPermissions,
  depth = 0,
  onItemClick,
}: MenuItemProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true);
  const isActive = activeSlug === item.slug;
  const hasChildren = item.children && item.children.length > 0;

  if (item.type === 'SEPARATOR') {
    return (
      <div
        data-slot="menu-separator"
        className="my-2 h-px bg-border"
        style={{ marginLeft: `${depth * 12}px` }}
      />
    );
  }

  function handleClick(): void {
    if (item.type === 'GROUP' && hasChildren) {
      setIsExpanded((prev) => !prev);
      return;
    }
    if (onItemClick) {
      onItemClick(item);
    }
  }

  function renderIcon(): React.JSX.Element | null {
    if (item.type === 'EXTERNAL') {
      return <ExternalLink className="h-4 w-4 shrink-0" />;
    }
    if (item.type === 'GROUP' && hasChildren) {
      if (isExpanded) {
        return <ChevronDown className="h-4 w-4 shrink-0" />;
      }
      return <ChevronRight className="h-4 w-4 shrink-0" />;
    }
    if (item.icon) {
      return <Minus className="h-4 w-4 shrink-0" />;
    }
    return null;
  }

  function renderChildren(): React.JSX.Element | null {
    if (!hasChildren || !isExpanded) {
      return null;
    }

    return (
      <div data-slot="menu-children" className="flex flex-col gap-1">
        {item.children!.map((child) => (
          <MenuItem
            key={child.id}
            item={child}
            activeSlug={activeSlug}
            userPermissions={userPermissions}
            depth={depth + 1}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div data-slot="menu-item-wrapper">
      <button
        data-slot="menu-item"
        type="button"
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-accent text-accent-foreground',
          item.type === 'GROUP' && 'font-semibold',
        )}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        {renderIcon()}
        <span className="truncate">{item.name}</span>
      </button>
      {renderChildren()}
    </div>
  );
}
```

### Drag-and-Drop Reorder

```tsx
// menu-sortable-tree.tsx

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IMenuItem } from './menu-types';

// --- Sortable Item ---

interface SortableMenuItemProps {
  item: IMenuItem;
  depth?: number;
  onEdit?: (item: IMenuItem) => void;
  onDelete?: (item: IMenuItem) => void;
}

export function SortableMenuItem({
  item,
  depth = 0,
  onEdit,
  onDelete,
}: SortableMenuItemProps): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${12 + depth * 24}px`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slot="sortable-menu-item"
      className={cn(
        'flex items-center gap-2 rounded-md border bg-background px-3 py-2',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      <button
        data-slot="drag-handle"
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="flex-1 truncate text-sm">{item.name}</span>
      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
        {item.type}
      </span>

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Edit
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="text-xs text-destructive hover:text-destructive/80"
        >
          Delete
        </button>
      )}
    </div>
  );
}

// --- Drop Indicator ---

export function DropIndicator(): React.JSX.Element {
  return (
    <div
      data-slot="drop-indicator"
      className="h-0.5 rounded-full bg-primary"
    />
  );
}

// --- Sortable Tree ---

interface MenuSortableTreeProps {
  items: Array<IMenuItem>;
  onReorder: (reorderedItems: Array<IMenuItem>) => void;
  onEdit?: (item: IMenuItem) => void;
  onDelete?: (item: IMenuItem) => void;
  className?: string;
}

function flattenItems(
  items: Array<IMenuItem>,
  depth: number = 0,
): Array<{ item: IMenuItem; depth: number }> {
  const result: Array<{ item: IMenuItem; depth: number }> = [];
  for (const item of items) {
    result.push({ item, depth });
    if (item.children && item.children.length > 0) {
      result.push(...flattenItems(item.children, depth + 1));
    }
  }
  return result;
}

export function MenuSortableTree({
  items,
  onReorder,
  onEdit,
  onDelete,
  className,
}: MenuSortableTreeProps): React.JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const flatItems = flattenItems(items);
  const itemIds = flatItems.map((fi) => fi.item.id);

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = flatItems.findIndex((fi) => fi.item.id === active.id);
    const newIndex = flatItems.findIndex((fi) => fi.item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = arrayMove(flatItems, oldIndex, newIndex);
    const updatedItems = reordered.map((fi, index) => ({
      ...fi.item,
      order: index,
    }));

    onReorder(updatedItems);
  }

  function getActiveItem(): IMenuItem | null {
    if (!activeId) {
      return null;
    }
    const found = flatItems.find((fi) => fi.item.id === activeId);
    if (!found) {
      return null;
    }
    return found.item;
  }

  const activeItem = getActiveItem();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveId(String(event.active.id))}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          data-slot="menu-sortable-tree"
          className={cn('flex flex-col gap-1', className)}
        >
          {flatItems.map((fi) => (
            <SortableMenuItem
              key={fi.item.id}
              item={fi.item}
              depth={fi.depth}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && (
          <div className="rounded-md border bg-background px-3 py-2 shadow-lg">
            <span className="text-sm">{activeItem.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

### Menu CRUD

```tsx
// menu-item-form.tsx

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { IMenuItem, MenuItemType } from './menu-types';

// --- Type Selector ---

const MENU_ITEM_TYPES: Array<{ value: MenuItemType; label: string }> = [
  { value: 'LINK', label: 'Link' },
  { value: 'PAGE', label: 'Page' },
  { value: 'RESOURCE', label: 'Resource' },
  { value: 'EXTERNAL', label: 'External URL' },
  { value: 'SEPARATOR', label: 'Separator' },
  { value: 'GROUP', label: 'Group' },
];

const VALID_MENU_ITEM_TYPES = new Set<string>(MENU_ITEM_TYPES.map((t) => t.value));

function isMenuItemType(value: string): value is MenuItemType {
  return VALID_MENU_ITEM_TYPES.has(value);
}

// --- Form ---

interface MenuItemFormProps {
  initialData?: Partial<IMenuItem>;
  parentOptions?: Array<{ id: string; name: string }>;
  resourceOptions?: Array<{ id: string; name: string }>;
  onSubmit: (data: Omit<IMenuItem, 'id' | 'children' | 'order'>) => void;
  onCancel: () => void;
  className?: string;
}

export function MenuItemForm({
  initialData,
  parentOptions = [],
  resourceOptions = [],
  onSubmit,
  onCancel,
  className,
}: MenuItemFormProps): React.JSX.Element {
  const [name, setName] = useState(initialData?.name ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [type, setType] = useState<MenuItemType>(initialData?.type ?? 'LINK');
  const [url, setUrl] = useState(initialData?.url ?? '');
  const [html, setHtml] = useState(initialData?.html ?? '');
  const [resourceId, setResourceId] = useState(initialData?.resourceId ?? '');
  const [parentId, setParentId] = useState(initialData?.parentId ?? null);
  const [icon, setIcon] = useState(initialData?.icon ?? '');

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    const typeFieldMap: Record<string, Partial<Pick<IMenuItem, 'url' | 'html' | 'resourceId'>>> = {
      EXTERNAL: { url },
      PAGE: { html },
      RESOURCE: { resourceId },
    };
    const typeFields = typeFieldMap[type] ?? {};

    onSubmit({
      name,
      slug,
      type,
      ...typeFields,
      parentId,
      icon,
    });
  }

  function renderTypeSpecificFields(): React.JSX.Element | null {
    if (type === 'EXTERNAL') {
      return (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="menu-url" className="text-sm font-medium">
            URL
          </label>
          <input
            id="menu-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>
      );
    }

    if (type === 'PAGE') {
      return (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="menu-html" className="text-sm font-medium">
            Page Content (HTML)
          </label>
          <textarea
            id="menu-html"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="<h1>Page Title</h1>"
            rows={5}
            className="rounded-md border px-3 py-2 text-sm"
          />
        </div>
      );
    }

    if (type === 'RESOURCE') {
      return (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="menu-resource" className="text-sm font-medium">
            {'{Entity}'}
          </label>
          <select
            id="menu-resource"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            required
          >
            <option value="">Select a {'{entity}'}...</option>
            {resourceOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return null;
  }

  if (type === 'SEPARATOR') {
    return (
      <form
        data-slot="menu-item-form"
        onSubmit={handleSubmit}
        className={cn('flex flex-col gap-4', className)}
      >
        <p className="text-sm text-muted-foreground">
          A separator has no additional fields.
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="menu-type" className="text-sm font-medium">
            Type
          </label>
          <select
            id="menu-type"
            value={type}
            onChange={(e) => {
              if (isMenuItemType(e.target.value)) {
                setType(e.target.value);
              }
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {MENU_ITEM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Save
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      data-slot="menu-item-form"
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-4', className)}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="menu-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="menu-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Menu item name"
          className="rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="menu-slug" className="text-sm font-medium">
          Slug
        </label>
        <input
          id="menu-slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="menu-item-slug"
          className="rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="menu-type" className="text-sm font-medium">
          Type
        </label>
        <select
          id="menu-type"
          value={type}
          onChange={(e) => {
              if (isMenuItemType(e.target.value)) {
                setType(e.target.value);
              }
            }}
          className="rounded-md border px-3 py-2 text-sm"
        >
          {MENU_ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="menu-icon" className="text-sm font-medium">
          Icon (Lucide name)
        </label>
        <input
          id="menu-icon"
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="home"
          className="rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="menu-parent" className="text-sm font-medium">
          Parent
        </label>
        <select
          id="menu-parent"
          value={parentId ?? ''}
          onChange={(e) => setParentId(e.target.value || null)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">None (root level)</option>
          {parentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {renderTypeSpecificFields()}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Save
        </button>
      </div>
    </form>
  );
}
```

```tsx
// menu-crud-actions.tsx

import type { IMenuItem } from './menu-types';

interface MenuCrudActionsProps {
  item: IMenuItem;
  onEdit: (item: IMenuItem) => void;
  onDelete: (item: IMenuItem) => void;
  onRestore?: (item: IMenuItem) => void;
  isDeleted?: boolean;
}

export function MenuCrudActions({
  item,
  onEdit,
  onDelete,
  onRestore,
  isDeleted = false,
}: MenuCrudActionsProps): React.JSX.Element {
  if (isDeleted && onRestore) {
    return (
      <div data-slot="menu-crud-actions" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onRestore(item)}
          className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
        >
          Restore
        </button>
      </div>
    );
  }

  return (
    <div data-slot="menu-crud-actions" className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => onDelete(item)}
        className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
      >
        Delete
      </button>
    </div>
  );
}
```

### Tree Editor Component

```tsx
// tree-editor.tsx

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---

export interface ITreeNode {
  id: string;
  name: string;
  parentId?: string | null;
  children?: Array<ITreeNode>;
}

// --- Tree Node ---

interface TreeNodeProps {
  node: ITreeNode;
  depth?: number;
  selectedId?: string | null;
  onSelect: (node: ITreeNode) => void;
  onAddChild: (parentId: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, newParentId: string | null) => void;
}

export function TreeNode({
  node,
  depth = 0,
  selectedId,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
  onMove,
}: TreeNodeProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  function handleToggle(): void {
    setIsExpanded((prev) => !prev);
  }

  function handleSelect(): void {
    onSelect(node);
  }

  function handleStartEdit(): void {
    setEditName(node.name);
    setIsEditing(true);
  }

  function handleConfirmEdit(): void {
    if (editName.trim()) {
      onRename(node.id, editName.trim());
    }
    setIsEditing(false);
  }

  function handleCancelEdit(): void {
    setIsEditing(false);
    setEditName(node.name);
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }

  function handleDeleteClick(): void {
    setShowConfirmDelete(true);
  }

  function handleConfirmDelete(): void {
    onDelete(node.id);
    setShowConfirmDelete(false);
  }

  function handleCancelDelete(): void {
    setShowConfirmDelete(false);
  }

  function renderExpandToggle(): React.JSX.Element | null {
    if (!hasChildren) {
      return <span className="w-4" />;
    }

    if (isExpanded) {
      return (
        <button type="button" onClick={handleToggle} className="p-0.5">
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      );
    }

    return (
      <button type="button" onClick={handleToggle} className="p-0.5">
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    );
  }

  function renderNodeContent(): React.JSX.Element {
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="rounded border px-2 py-0.5 text-sm"
            autoFocus
          />
          <button type="button" onClick={handleConfirmEdit} className="p-0.5">
            <Check className="h-3.5 w-3.5 text-green-600" />
          </button>
          <button type="button" onClick={handleCancelEdit} className="p-0.5">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      );
    }

    if (showConfirmDelete) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-destructive">Delete "{node.name}"?</span>
          <button
            type="button"
            onClick={handleConfirmDelete}
            className="rounded bg-destructive px-2 py-0.5 text-xs text-destructive-foreground"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={handleCancelDelete}
            className="rounded border px-2 py-0.5 text-xs"
          >
            No
          </button>
        </div>
      );
    }

    return (
      <div className="group flex flex-1 items-center gap-1">
        <button
          type="button"
          onClick={handleSelect}
          className={cn(
            'flex-1 truncate text-left text-sm',
            isSelected && 'font-medium text-primary',
          )}
        >
          {node.name}
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onAddChild(node.id)}
            className="rounded p-0.5 hover:bg-accent"
            title="Add child"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={handleStartEdit}
            className="rounded p-0.5 hover:bg-accent"
            title="Rename"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="rounded p-0.5 hover:bg-destructive/10"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        </div>
      </div>
    );
  }

  function renderChildren(): React.JSX.Element | null {
    if (!hasChildren || !isExpanded) {
      return null;
    }

    return (
      <div className="flex flex-col">
        {node.children!.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onRename={onRename}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </div>
    );
  }

  return (
    <div data-slot="tree-node">
      <div
        className="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-accent/50"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {renderExpandToggle()}
        {renderNodeContent()}
      </div>
      {renderChildren()}
    </div>
  );
}

// --- Tree Editor ---

interface TreeEditorProps {
  nodes: Array<ITreeNode>;
  onAddChild: (parentId: string | null) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, newParentId: string | null) => void;
  onSelect?: (node: ITreeNode) => void;
  className?: string;
}

export function TreeEditor({
  nodes,
  onAddChild,
  onRename,
  onDelete,
  onMove,
  onSelect,
  className,
}: TreeEditorProps): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelect(node: ITreeNode): void {
    setSelectedId(node.id);
    if (onSelect) {
      onSelect(node);
    }
  }

  return (
    <div data-slot="tree-editor" className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tree Editor</h3>
        <button
          type="button"
          onClick={() => onAddChild(null)}
          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
        >
          <Plus className="h-3 w-3" />
          Add root node
        </button>
      </div>

      <div className="rounded-md border p-2">
        {nodes.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No nodes yet. Click "Add root node" to start.
          </p>
        )}
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            selectedId={selectedId}
            onSelect={handleSelect}
            onAddChild={onAddChild}
            onRename={onRename}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </div>
    </div>
  );
}
```

### Sidebar Menu Layout

```tsx
// sidebar-layout.tsx

import { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MenuTree } from './menu-tree';
import type { IMenuItem } from './menu-types';

// --- Sidebar State Persistence ---

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';

function getSavedCollapsedState(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (saved === null) {
    return false;
  }
  return saved === 'true';
}

function saveCollapsedState(collapsed: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
}

// --- Mobile Overlay ---

interface MobileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileOverlay({
  isOpen,
  onClose,
  children,
}: MobileOverlayProps): React.JSX.Element | null {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div data-slot="mobile-overlay" className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        role="presentation"
      />
      <div className="absolute inset-y-0 left-0 w-72 bg-background shadow-xl">
        <div className="flex items-center justify-end p-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// --- Sidebar ---

interface SidebarMenuProps {
  items: Array<IMenuItem>;
  activeSlug?: string;
  userPermissions?: Array<string>;
  onItemClick?: (item: IMenuItem) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function SidebarMenu({
  items,
  activeSlug,
  userPermissions,
  onItemClick,
  header,
  footer,
  className,
}: SidebarMenuProps): React.JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState(getSavedCollapsedState);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function handleToggleCollapse(): void {
    setIsCollapsed((prev) => {
      const next = !prev;
      saveCollapsedState(next);
      return next;
    });
  }

  function handleMobileItemClick(item: IMenuItem): void {
    setIsMobileOpen(false);
    if (onItemClick) {
      onItemClick(item);
    }
  }

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md border bg-background p-2 shadow-sm lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      <MobileOverlay
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      >
        <div className="flex flex-col p-4">
          {header && <div className="mb-4">{header}</div>}
          <MenuTree
            items={items}
            activeSlug={activeSlug}
            userPermissions={userPermissions}
            onItemClick={handleMobileItemClick}
          />
          {footer && <div className="mt-auto pt-4">{footer}</div>}
        </div>
      </MobileOverlay>

      {/* Desktop sidebar */}
      <aside
        data-slot="sidebar-menu"
        className={cn(
          'hidden lg:flex lg:flex-col lg:border-r lg:bg-background transition-all duration-200',
          isCollapsed && 'lg:w-16',
          !isCollapsed && 'lg:w-64',
          className,
        )}
      >
        <div className="flex items-center justify-end p-2">
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="rounded-md p-1 hover:bg-accent"
            aria-label={(() => {
              if (isCollapsed) return 'Expand sidebar';
              return 'Collapse sidebar';
            })()}
          >
            {isCollapsed && <PanelLeftOpen className="h-4 w-4" />}
            {!isCollapsed && <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            {header && <div className="mb-4">{header}</div>}
            <MenuTree
              items={items}
              activeSlug={activeSlug}
              userPermissions={userPermissions}
              onItemClick={onItemClick}
            />
            {footer && <div className="mt-auto pt-4">{footer}</div>}
          </div>
        )}
      </aside>
    </>
  );
}

// --- Full Layout ---

interface SidebarLayoutProps {
  items: Array<IMenuItem>;
  activeSlug?: string;
  userPermissions?: Array<string>;
  onItemClick?: (item: IMenuItem) => void;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarLayout({
  items,
  activeSlug,
  userPermissions,
  onItemClick,
  sidebarHeader,
  sidebarFooter,
  children,
}: SidebarLayoutProps): React.JSX.Element {
  return (
    <div data-slot="sidebar-layout" className="flex h-screen">
      <SidebarMenu
        items={items}
        activeSlug={activeSlug}
        userPermissions={userPermissions}
        onItemClick={onItemClick}
        header={sidebarHeader}
        footer={sidebarFooter}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

## Checklist

When generating tree navigation components:
- [ ] Named exports with explicit return type (`React.JSX.Element`)
- [ ] Props interface directly above component function
- [ ] `data-slot` attribute on composable parts
- [ ] `cn()` for conditional Tailwind classes
- [ ] No ternary operators — use if/else, early return, or helper functions
- [ ] Recursive rendering for nested items (not flat arrays with indentation)
- [ ] Keyboard navigation support (Enter, Escape, Arrow keys where applicable)
- [ ] Permission-aware filtering when `userPermissions` is provided
- [ ] Type-dependent fields in forms (URL for EXTERNAL, HTML for PAGE, resource selector for RESOURCE)
- [ ] Drag handle visible and accessible for sortable items
- [ ] Mobile-responsive sidebar (overlay on small screens)
- [ ] Persisted sidebar collapse state in localStorage
- [ ] Accessible (aria-label on icon-only buttons, role attributes on overlays)
