---
name: frontend-view
description: |
  Generates table view types (list, card, kanban, calendar, etc.) for frontend projects.
  Use when: user asks to create a table view, list view, card view, grid view, kanban view,
  calendar view, gallery view, or mentions "view" for data visualization layouts.
  Supports: Multiple view styles, lazy loading, skeleton loading.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Table**: `@tanstack/react-table` (for list views)
   - **DnD**: `@dnd-kit/core` (for kanban views)
   - **Calendar**: `date-fns` | `dayjs` (for calendar views)
   - **Charts**: `recharts` (for gantt views)
3. Scan existing views to detect:
   - View file location (e.g., `routes/_private/tables/$slug/`)
   - Naming pattern (`-table-{style}-view.tsx`)
   - VIEW_MAP pattern in lazy route
   - Cell renderer pattern (switch-case by field type)
   - Layout field resolver pattern

## Conventions

### Naming
- View file: `-table-{style}-view.tsx` (dash prefix = private/co-located)
- Skeleton file: `-table-{style}-view-skeleton.tsx`
- Cell renderer: `RenderCell()` or `Render{Style}Cell()` function

### File Placement
Co-located with the route that uses them:
```
routes/_private/tables/$slug/
├── index.tsx
├── index.lazy.tsx           ← VIEW_MAP lives here
├── -table-list-view.tsx
├── -table-list-view-skeleton.tsx
├── -table-card-view.tsx
├── -table-card-view-skeleton.tsx
├── -table-kanban-view.tsx
└── -table-kanban-view-skeleton.tsx
```

### Rules
- Each view is a standalone component with standard props
- Cell renderers use switch-case by field type (no ternaries)
- Skeleton matches the visual structure of the view
- Lazy load views via `React.lazy()` in a VIEW_MAP
- Layout fields (`cover`, `title`, `description`) resolved via utility
- No ternary operators

## View Types

| Style | Description | Key Library |
|-------|-------------|-------------|
| LIST | Table/grid with rows and columns | TanStack Table |
| CARD | Cards in a responsive grid | CSS Grid |
| GALLERY | Image-focused grid | CSS Grid |
| KANBAN | Columns with draggable cards | dnd-kit |
| CALENDAR | Date-based event display | date-fns |
| DOCUMENT | Long-form document layout | Prose/Markdown |
| FORUM | Discussion thread layout | Custom |
| MOSAIC | Masonry-style image grid | CSS columns |
| GANTT | Timeline with horizontal bars | recharts/custom |

## Templates

### View Props Interface

```typescript
import type { IField, IRow, ITable } from '@/lib/interfaces';

interface TableViewProps {
  data: Array<IRow>;
  headers: Array<IField>;
  order: Array<string>;
  layoutFields?: ILayoutFields | null;
}

// Extended props for views that need table metadata
interface TableViewExtraProps extends TableViewProps {
  tableSlug: string;
  table: ITable;
}

interface ILayoutFields {
  cover?: string;   // field slug for cover image
  title?: string;   // field slug for title
  description?: string; // field slug for description
}
```

### Card View (Reference Implementation)

```tsx
import { useNavigate, useParams } from '@tanstack/react-router';
import React from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow } from '@/lib/interfaces';

interface CardViewProps {
  data: Array<IRow>;
  headers: Array<IField>;
  order: Array<string>;
  layoutFields?: { cover?: string; title?: string; description?: string } | null;
}

function RenderCardCell({
  field,
  row,
}: {
  field: IField;
  row: IRow;
}): React.JSX.Element {
  const value = row[field.slug];

  if (value === null || value === undefined) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  switch (field.type) {
    case E_FIELD_TYPE.TEXT_SHORT:
      return <span className="text-sm truncate">{String(value)}</span>;
    case E_FIELD_TYPE.TEXT_LONG:
      return (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {String(value)}
        </span>
      );
    case E_FIELD_TYPE.DATE:
      return <span className="text-sm">{formatDate(String(value))}</span>;
    case E_FIELD_TYPE.DROPDOWN:
      if (Array.isArray(value)) {
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((item, i) => (
              <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {item.label ?? String(item)}
              </span>
            ))}
          </div>
        );
      }
      return <span className="text-sm">{String(value)}</span>;
    case E_FIELD_TYPE.FILE:
      return <span className="text-sm text-muted-foreground">File</span>;
    case E_FIELD_TYPE.RELATIONSHIP:
      if (Array.isArray(value)) {
        return <span className="text-sm">{value.length} items</span>;
      }
      return <span className="text-sm">{String(value)}</span>;
    default:
      return <span className="text-sm">{String(value)}</span>;
  }
}

export function TableCardView({
  data,
  headers,
  order,
  layoutFields,
}: CardViewProps): React.JSX.Element {
  const navigate = useNavigate();
  const { slug } = useParams({ from: '/_private/tables/$slug/' });

  const sortedFields = React.useMemo(() => {
    return headers
      .filter((f) => f.showInList && !f.trashed)
      .sort((a, b) => {
        const idxA = order.indexOf(a._id);
        const idxB = order.indexOf(b._id);
        function getIdx(idx: number): number {
          if (idx === -1) return Infinity;
          return idx;
        }
        return getIdx(idxA) - getIdx(idxB);
      });
  }, [headers, order]);

  const titleField = sortedFields.find((f) => f.slug === layoutFields?.title);
  const descField = sortedFields.find((f) => f.slug === layoutFields?.description);
  const extraFields = sortedFields.filter(
    (f) => f.slug !== layoutFields?.title && f.slug !== layoutFields?.description && f.slug !== layoutFields?.cover,
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((row) => (
        <Card
          key={row._id}
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate({ to: '/tables/$slug/rows/$rowId', params: { slug, rowId: row._id } })}
        >
          <CardHeader>
            {titleField && (
              <h3 className="font-medium truncate">
                {String(row[titleField.slug] ?? '')}
              </h3>
            )}
            {descField && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {String(row[descField.slug] ?? '')}
              </p>
            )}
          </CardHeader>
          {extraFields.length > 0 && (
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {extraFields.slice(0, 4).map((field) => (
                  <div key={field._id} className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{field.name}</p>
                    <RenderCardCell field={field} row={row} />
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
```

### Card View Skeleton

```tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TableCardViewSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j}>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### VIEW_MAP Pattern (in lazy route)

```tsx
import React from 'react';

import { TableCardViewSkeleton } from './-table-card-view-skeleton';
import { TableListViewSkeleton } from './-table-list-view-skeleton';

const VIEW_MAP: Record<string, {
  skeleton: React.ComponentType;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  extraProps?: boolean;
}> = {
  LIST: {
    skeleton: TableListViewSkeleton,
    component: React.lazy(() =>
      import('./-table-list-view').then((m) => ({ default: m.TableListView })),
    ),
  },
  CARD: {
    skeleton: TableCardViewSkeleton,
    component: React.lazy(() =>
      import('./-table-card-view').then((m) => ({ default: m.TableCardView })),
    ),
  },
  KANBAN: {
    skeleton: TableListViewSkeleton, // fallback skeleton
    component: React.lazy(() =>
      import('./-table-kanban-view').then((m) => ({ default: m.TableKanbanView })),
    ),
    extraProps: true,
  },
  // Add more view types...
};

// Usage in route component
function RouteComponent(): React.JSX.Element {
  const style = table?.style ?? 'LIST';
  const view = VIEW_MAP[style] ?? VIEW_MAP.LIST;
  const ViewComponent = view.component;
  const ViewSkeleton = view.skeleton;

  if (isLoading) {
    return <ViewSkeleton />;
  }

  const baseProps = { data: rows, headers: fields, order: fieldOrder, layoutFields };

  if (view.extraProps) {
    return (
      <React.Suspense fallback={<ViewSkeleton />}>
        <ViewComponent {...baseProps} tableSlug={slug} table={table} />
      </React.Suspense>
    );
  }

  return (
    <React.Suspense fallback={<ViewSkeleton />}>
      <ViewComponent {...baseProps} />
    </React.Suspense>
  );
}
```

### Layout Field Resolver

```typescript
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField } from '@/lib/interfaces';

interface ResolvedLayoutFields {
  cover?: IField;
  title?: IField;
  description?: IField;
}

export function resolveLayoutFields(
  fields: Array<IField>,
  layoutConfig?: { cover?: string; title?: string; description?: string } | null,
): ResolvedLayoutFields {
  const result: ResolvedLayoutFields = {};

  if (layoutConfig?.cover) {
    result.cover = fields.find((f) => f.slug === layoutConfig.cover && f.type === E_FIELD_TYPE.FILE);
  }
  if (layoutConfig?.title) {
    result.title = fields.find((f) => f.slug === layoutConfig.title);
  }
  if (layoutConfig?.description) {
    result.description = fields.find((f) => f.slug === layoutConfig.description);
  }

  // Auto-detect if not configured
  if (!result.title) {
    result.title = fields.find((f) => f.type === E_FIELD_TYPE.TEXT_SHORT && f.showInList);
  }
  if (!result.description) {
    result.description = fields.find((f) => f.type === E_FIELD_TYPE.TEXT_LONG && f.showInList);
  }

  return result;
}
```

## Checklist

- [ ] Standard props interface (data, headers, order, layoutFields)
- [ ] Cell renderer with switch-case (no ternaries)
- [ ] Skeleton component matching view structure
- [ ] Lazy loading via React.lazy() in VIEW_MAP
- [ ] Layout field resolution (cover, title, description)
- [ ] Responsive grid/layout
- [ ] Click navigation to detail view
- [ ] No ternary operators
