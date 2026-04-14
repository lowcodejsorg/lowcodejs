---
name: maiyu:frontend-view
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
- No ternary operators — use `{condition && <el>}`, if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

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
  component: React.LazyExoticComponent<React.ComponentType<TableViewProps>>;
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

### Kanban View

```tsx
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, GripVertical, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanColumn {
  id: string;
  label: string;
  color?: string;
}

interface KanbanViewProps {
  data: Array<Record<string, unknown>>;
  columns: Array<KanbanColumn>;
  groupByField: string;
  titleField?: string;
  descriptionField?: string;
  onCardMove?: (cardId: string, fromColumn: string, toColumn: string) => void;
  onCardClick?: (cardId: string) => void;
  onCardCreate?: (columnId: string, value: string) => void;
}

function SortableCard({
  id,
  title,
  description,
  onCardClick,
}: {
  id: string;
  title: string;
  description?: string;
  onCardClick?: (id: string) => void;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn('cursor-pointer hover:bg-muted/50', isDragging && 'opacity-50')}
      onClick={() => onCardClick?.(id)}
    >
      <CardHeader className="flex flex-row items-center gap-2 p-3">
        <button {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <h4 className="text-sm font-medium truncate flex-1">{title}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
              onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      {description && (
        <CardContent className="px-3 pb-3 pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}

function InlineCardCreator({
  onSubmit,
}: {
  onSubmit: (value: string) => void;
}): React.JSX.Element {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState('');

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="mr-1 h-3 w-3" /> Add card
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) {
          onSubmit(value.trim());
          setValue('');
          setIsAdding(false);
        }
      }}
      className="space-y-2"
    >
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Card title..."
        onBlur={() => {
          if (!value.trim()) setIsAdding(false);
        }}
      />
      <div className="flex gap-1">
        <Button type="submit" size="sm">Add</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function TableKanbanView({
  data,
  columns,
  groupByField,
  titleField,
  descriptionField,
  onCardMove,
  onCardClick,
  onCardCreate,
}: KanbanViewProps): React.JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null);

  const cardsByColumn = React.useMemo(() => {
    const map: Record<string, Array<Record<string, unknown>>> = {};
    for (const col of columns) {
      map[col.id] = [];
    }
    for (const row of data) {
      const colId = String(row[groupByField] ?? '');
      if (map[colId]) {
        map[colId].push(row);
      }
    }
    return map;
  }, [data, columns, groupByField]);

  function handleDragEnd(event: { active: { id: string }; over: { id: string } | null }): void {
    setActiveId(null);
    if (!event.over) return;
    // Determine source and destination columns, call onCardMove
    onCardMove?.(String(event.active.id), '', String(event.over.id));
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-4 h-full">
        {columns.map((col) => {
          const cards = cardsByColumn[col.id] ?? [];
          return (
            <div
              key={col.id}
              className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/30 p-2"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  {col.color && (
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                  )}
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="text-xs text-muted-foreground">{cards.length}</span>
                </div>
              </div>

              <SortableContext
                items={cards.map((c) => String(c._id))}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                  {cards.map((card) => {
                    const cardId = String(card._id);
                    let cardTitle = cardId;
                    if (titleField) {
                      cardTitle = String(card[titleField] ?? '');
                    }
                    let cardDescription: string | undefined;
                    if (descriptionField) {
                      cardDescription = String(card[descriptionField] ?? '');
                    }

                    return (
                      <SortableCard
                        key={cardId}
                        id={cardId}
                        title={cardTitle}
                        description={cardDescription}
                        onCardClick={onCardClick}
                      />
                    );
                  })}
                </div>
              </SortableContext>

              {onCardCreate && (
                <div className="mt-2">
                  <InlineCardCreator onSubmit={(val) => onCardCreate(col.id, val)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeId && (
          <Card className="w-72 opacity-80 shadow-lg">
            <CardHeader className="p-3">
              <span className="text-sm font-medium">Moving...</span>
            </CardHeader>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

### Calendar View

```tsx
import React, { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from 'date-fns';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

type CalendarMode = 'month' | 'week' | 'agenda';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  color?: string;
  [key: string]: unknown;
}

interface CalendarViewProps {
  events: Array<CalendarEvent>;
  onEventClick?: (eventId: string) => void;
  onDateClick?: (date: Date) => void;
  onEventCreate?: (date: Date) => void;
  locale?: Locale;
}

function MonthGrid({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: {
  currentDate: Date;
  events: Array<CalendarEvent>;
  onEventClick?: (id: string) => void;
  onDateClick?: (date: Date) => void;
}): React.JSX.Element {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-[repeat(auto-fill,minmax(80px,1fr))]">
        {days.map((day) => {
          const dayEvents = events.filter((e) =>
            isSameDay(e.start, day) ||
            (e.end && isWithinInterval(day, { start: startOfDay(e.start), end: endOfDay(e.end) }))
          );
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-20 border-b border-r p-1 cursor-pointer hover:bg-muted/30',
                !isCurrentMonth && 'bg-muted/10 text-muted-foreground',
              )}
              onClick={() => onDateClick?.(day)}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  isToday && 'bg-primary text-primary-foreground',
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="truncate rounded px-1 text-xs cursor-pointer"
                    style={{ backgroundColor: event.color ?? '#3b82f6', color: '#fff' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event.id);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-xs text-muted-foreground px-1">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: {
  currentDate: Date;
  events: Array<CalendarEvent>;
  onEventClick?: (id: string) => void;
  onDateClick?: (date: Date) => void;
}): React.JSX.Element {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-1 overflow-auto">
      <div className="w-16 shrink-0">
        {hours.map((hour) => (
          <div key={hour} className="h-12 border-b px-2 text-right text-xs text-muted-foreground">
            {String(hour).padStart(2, '0')}:00
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7">
        {days.map((day) => (
          <div key={day.toISOString()} className="border-l">
            <div className="sticky top-0 z-10 border-b bg-background p-1 text-center text-xs font-medium">
              {format(day, 'EEE d')}
            </div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 border-b cursor-pointer hover:bg-muted/30"
                onClick={() => onDateClick?.(day)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AgendaView({
  events,
  onEventClick,
}: {
  events: Array<CalendarEvent>;
  onEventClick?: (id: string) => void;
}): React.JSX.Element {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events],
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        No events
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto divide-y">
      {sortedEvents.map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-4 p-3 cursor-pointer hover:bg-muted/50"
          onClick={() => onEventClick?.(event.id)}
        >
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: event.color ?? '#3b82f6' }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {format(event.start, 'PPP p')}
              {event.end && ` — ${format(event.end, 'p')}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableCalendarView({
  events,
  onEventClick,
  onDateClick,
  onEventCreate,
}: CalendarViewProps): React.JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<CalendarMode>('month');

  function navigateBack(): void {
    if (mode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  }

  function navigateForward(): void {
    if (mode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b p-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigateBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={navigateForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold">
            {(() => {
              const FORMAT_MAP = { month: 'MMMM yyyy', week: "'Week of' MMM d, yyyy", agenda: 'MMMM yyyy' } as const;
              return format(currentDate, FORMAT_MAP[mode]);
            })()}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <div className="flex rounded-md border">
            {(['month', 'week', 'agenda'] as const).map((m) => {
              let variant: 'default' | 'ghost' = 'ghost';
              if (mode === m) {
                variant = 'default';
              }
              return (
                <Button
                  key={m}
                  variant={variant}
                  size="sm"
                  className="rounded-none first:rounded-l-md last:rounded-r-md"
                  onClick={() => setMode(m)}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Button>
              );
            })}
          </div>
          {onEventCreate && (
            <Button size="sm" onClick={() => onEventCreate(currentDate)}>
              <Plus className="mr-1 h-3 w-3" /> New
            </Button>
          )}
        </div>
      </div>

      {/* View */}
      {mode === 'month' && (
        <MonthGrid
          currentDate={currentDate}
          events={events}
          onEventClick={onEventClick}
          onDateClick={onDateClick}
        />
      )}
      {mode === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={events}
          onEventClick={onEventClick}
          onDateClick={onDateClick}
        />
      )}
      {mode === 'agenda' && (
        <AgendaView events={events} onEventClick={onEventClick} />
      )}
    </div>
  );
}
```

### Document View

```tsx
import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentEntry {
  id: string;
  title: string;
  content: string;
  [key: string]: unknown;
}

interface DocumentViewProps {
  entries: Array<DocumentEntry>;
  onEntryClick?: (entryId: string) => void;
  onExportPdf?: () => void;
}

function TableOfContents({
  entries,
  activeId,
  onSelect,
}: {
  entries: Array<DocumentEntry>;
  activeId: string | null;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  return (
    <nav className="w-56 shrink-0 overflow-y-auto border-r p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        Contents
      </h3>
      <ul className="space-y-0.5">
        {entries.map((entry, index) => (
          <li key={entry.id}>
            <button
              className={cn(
                'w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted',
                activeId === entry.id && 'bg-muted font-medium',
              )}
              onClick={() => onSelect(entry.id)}
            >
              {index + 1}. {entry.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function TableDocumentView({
  entries,
  onEntryClick,
  onExportPdf,
}: DocumentViewProps): React.JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);
  const contentRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<Record<string, HTMLElement | null>>({});

  function scrollToEntry(id: string): void {
    setActiveId(id);
    entryRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handlePrint(): void {
    window.print();
  }

  // Track active entry on scroll via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (obs) => {
        for (const entry of obs) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { root: contentRef.current, threshold: 0.5 },
    );

    for (const el of Object.values(entryRefs.current)) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [entries]);

  return (
    <div className="flex h-full">
      <TableOfContents entries={entries} activeId={activeId} onSelect={scrollToEntry} />

      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-b p-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1 h-3 w-3" /> Print
          </Button>
          {onExportPdf && (
            <Button variant="outline" size="sm" onClick={onExportPdf}>
              <Download className="mr-1 h-3 w-3" /> PDF
            </Button>
          )}
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 print:p-0">
          <div className="mx-auto max-w-3xl space-y-8">
            {entries.map((entry) => (
              <Card
                key={entry.id}
                id={entry.id}
                ref={(el) => { entryRefs.current[entry.id] = el; }}
                className="cursor-pointer hover:ring-1 hover:ring-ring print:shadow-none print:border-0"
                onClick={() => onEntryClick?.(entry.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">{entry.title}</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* IMPORTANT: Always sanitize HTML content before rendering */}
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.content) }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Forum View

```tsx
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Hash, Plus, Send, Users } from 'lucide-react';

interface ForumChannel {
  id: string;
  name: string;
  description?: string;
  unreadCount?: number;
}

interface ForumMessage {
  id: string;
  channelId: string;
  content: string;
  author: { id: string; name: string };
  createdAt: Date;
}

interface ForumViewProps {
  channels: Array<ForumChannel>;
  messages: Array<ForumMessage>;
  activeChannelId?: string;
  onChannelSelect?: (channelId: string) => void;
  onChannelCreate?: (name: string) => void;
  onMessageSend?: (channelId: string, content: string) => void;
  onManageParticipants?: (channelId: string) => void;
}

function ChannelSidebar({
  channels,
  activeChannelId,
  onChannelSelect,
  onChannelCreate,
}: {
  channels: Array<ForumChannel>;
  activeChannelId?: string;
  onChannelSelect?: (id: string) => void;
  onChannelCreate?: (name: string) => void;
}): React.JSX.Element {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <div className="flex w-56 shrink-0 flex-col border-r">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-semibold">Channels</h3>
        {onChannelCreate && (
          <Button variant="ghost" size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isCreating && (
        <form
          className="border-b p-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) {
              onChannelCreate?.(newName.trim());
              setNewName('');
              setIsCreating(false);
            }
          }}
        >
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Channel name..."
            onBlur={() => {
              if (!newName.trim()) setIsCreating(false);
            }}
          />
        </form>
      )}

      <ScrollArea className="flex-1">
        {channels.map((channel) => (
          <button
            key={channel.id}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted',
              activeChannelId === channel.id && 'bg-muted font-medium',
            )}
            onClick={() => onChannelSelect?.(channel.id)}
          >
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="flex-1 truncate text-left">{channel.name}</span>
            {channel.unreadCount && channel.unreadCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {channel.unreadCount}
              </span>
            )}
          </button>
        ))}
      </ScrollArea>
    </div>
  );
}

function MessageThread({
  messages,
  channelId,
  onMessageSend,
  onManageParticipants,
}: {
  messages: Array<ForumMessage>;
  channelId: string;
  onMessageSend?: (channelId: string, content: string) => void;
  onManageParticipants?: (channelId: string) => void;
}): React.JSX.Element {
  const [draft, setDraft] = useState('');

  return (
    <div className="flex flex-1 flex-col">
      {/* Channel header */}
      <div className="flex shrink-0 items-center justify-between border-b p-3">
        <h3 className="text-sm font-semibold">Messages</h3>
        {onManageParticipants && (
          <Button variant="ghost" size="sm" onClick={() => onManageParticipants(channelId)}>
            <Users className="mr-1 h-3 w-3" /> Participants
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {msg.author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{msg.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {msg.createdAt.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      {onMessageSend && (
        <form
          className="shrink-0 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) {
              onMessageSend(channelId, draft.trim());
              setDraft('');
            }
          }}
        >
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function TableForumView({
  channels,
  messages,
  activeChannelId,
  onChannelSelect,
  onChannelCreate,
  onMessageSend,
  onManageParticipants,
}: ForumViewProps): React.JSX.Element {
  const activeChannel = activeChannelId ?? channels[0]?.id;
  const channelMessages = messages.filter((m) => m.channelId === activeChannel);

  return (
    <div className="flex h-full">
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannel}
        onChannelSelect={onChannelSelect}
        onChannelCreate={onChannelCreate}
      />
      {activeChannel && (
        <MessageThread
          messages={channelMessages}
          channelId={activeChannel}
          onMessageSend={onMessageSend}
          onManageParticipants={onManageParticipants}
        />
      )}
      {!activeChannel && (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Select a channel
        </div>
      )}
    </div>
  );
}
```

### Gantt View

```tsx
import React, { useState, useMemo } from 'react';
import {
  differenceInDays,
  addDays,
  format,
  startOfDay,
  max as dateMax,
  min as dateMin,
} from 'date-fns';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface GanttTask {
  id: string;
  title: string;
  start: Date;
  end: Date;
  progress?: number; // 0-100
  color?: string;
  [key: string]: unknown;
}

interface GanttViewProps {
  tasks: Array<GanttTask>;
  onTaskClick?: (taskId: string) => void;
}

const DAY_WIDTH_OPTIONS = [20, 40, 60, 80];

export function TableGanttView({
  tasks,
  onTaskClick,
}: GanttViewProps): React.JSX.Element {
  const [dayWidthIndex, setDayWidthIndex] = useState(1);
  const dayWidth = DAY_WIDTH_OPTIONS[dayWidthIndex];

  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const today = startOfDay(new Date());
      return { timelineStart: today, timelineEnd: addDays(today, 30), totalDays: 30 };
    }
    const starts = tasks.map((t) => t.start);
    const ends = tasks.map((t) => t.end);
    const earliest = startOfDay(dateMin(starts));
    const latest = startOfDay(dateMax(ends));
    const padding = 7;
    const tStart = addDays(earliest, -padding);
    const tEnd = addDays(latest, padding);
    return {
      timelineStart: tStart,
      timelineEnd: tEnd,
      totalDays: differenceInDays(tEnd, tStart),
    };
  }, [tasks]);

  const timelineDays = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addDays(timelineStart, i)),
    [timelineStart, totalDays],
  );

  function getBarStyle(task: GanttTask): React.CSSProperties {
    const startOffset = differenceInDays(startOfDay(task.start), timelineStart);
    const duration = differenceInDays(startOfDay(task.end), startOfDay(task.start)) + 1;
    return {
      left: startOffset * dayWidth,
      width: duration * dayWidth,
    };
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b p-2">
        <h3 className="text-sm font-semibold">Timeline</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={dayWidthIndex === 0}
            onClick={() => setDayWidthIndex(dayWidthIndex - 1)}
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={dayWidthIndex === DAY_WIDTH_OPTIONS.length - 1}
            onClick={() => setDayWidthIndex(dayWidthIndex + 1)}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Side panel — task list */}
        <div className="w-56 shrink-0 overflow-y-auto border-r">
          <div className="sticky top-0 z-10 border-b bg-muted/50 p-2 text-xs font-semibold">
            Tasks
          </div>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex h-10 items-center border-b px-3 text-sm truncate cursor-pointer hover:bg-muted/50"
              onClick={() => onTaskClick?.(task.id)}
            >
              {task.title}
            </div>
          ))}
        </div>

        {/* Timeline */}
        <ScrollArea className="flex-1" orientation="both">
          <div style={{ width: totalDays * dayWidth, minHeight: '100%' }}>
            {/* Date header */}
            <div className="sticky top-0 z-10 flex border-b bg-background">
              {timelineDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="shrink-0 border-r p-1 text-center text-xs text-muted-foreground"
                  style={{ width: dayWidth }}
                >
                  {dayWidth >= 40 && format(day, 'd')}
                  {dayWidth >= 60 && <br />}
                  {dayWidth >= 60 && (
                    <span className="text-[10px]">{format(day, 'MMM')}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Task bars */}
            {tasks.map((task) => {
              const barStyle = getBarStyle(task);
              const progress = task.progress ?? 0;

              return (
                <div key={task.id} className="relative h-10 border-b">
                  <div
                    className="absolute top-1.5 h-7 rounded cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      ...barStyle,
                      backgroundColor: task.color ?? '#3b82f6',
                    }}
                    onClick={() => onTaskClick?.(task.id)}
                  >
                    {/* Progress fill */}
                    <div
                      className="h-full rounded bg-black/20"
                      style={{ width: `${progress}%` }}
                    />
                    {barStyle.width > 60 && (
                      <span className="absolute inset-0 flex items-center px-2 text-xs text-white truncate">
                        {task.title}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
```

### Mosaic View (Masonry)

```tsx
import React from 'react';

interface MosaicViewProps {
  data: Array<Record<string, unknown>>;
  coverField?: string;
  titleField?: string;
  descriptionField?: string;
  onItemClick?: (itemId: string) => void;
}

export function TableMosaicView({
  data,
  coverField,
  titleField,
  descriptionField,
  onItemClick,
}: MosaicViewProps): React.JSX.Element {
  return (
    <div className="columns-1 gap-4 p-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {data.map((row) => {
        const id = String(row._id);
        let cover: string | undefined;
        if (coverField && typeof row[coverField] === 'string') {
          cover = row[coverField];
        }
        let title = '';
        if (titleField) {
          title = String(row[titleField] ?? '');
        }
        let desc = '';
        if (descriptionField) {
          desc = String(row[descriptionField] ?? '');
        }

        return (
          <div
            key={id}
            className="mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
            onClick={() => onItemClick?.(id)}
          >
            {cover && (
              <img
                src={cover}
                alt={title}
                className="w-full object-cover"
                loading="lazy"
              />
            )}
            <div className="p-3">
              {title && <h3 className="text-sm font-medium truncate">{title}</h3>}
              {desc && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{desc}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Gallery View

```tsx
import React from 'react';

interface GalleryViewProps {
  data: Array<Record<string, unknown>>;
  coverField?: string;
  titleField?: string;
  onItemClick?: (itemId: string) => void;
}

export function TableGalleryView({
  data,
  coverField,
  titleField,
  onItemClick,
}: GalleryViewProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {data.map((row) => {
        const id = String(row._id);
        let cover: string | undefined;
        if (coverField && typeof row[coverField] === 'string') {
          cover = row[coverField];
        }
        let title = '';
        if (titleField) {
          title = String(row[titleField] ?? '');
        }

        return (
          <div
            key={id}
            className="group cursor-pointer overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
            onClick={() => onItemClick?.(id)}
          >
            <div className="aspect-square bg-muted">
              {cover && (
                <img
                  src={cover}
                  alt={title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              )}
              {!cover && (
                <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                  No image
                </div>
              )}
            </div>
            {title && (
              <div className="p-2">
                <p className="text-sm truncate">{title}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
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
- [ ] Calendar: month/week/agenda modes + navigation + event CRUD
- [ ] Kanban: drag-drop between columns + inline card creation + quick actions
- [ ] Document: sidebar TOC + scroll tracking + print + PDF export + sanitized HTML
- [ ] Forum: channel sidebar + message thread + message input + participants
- [ ] Gantt: task side panel + timeline header + progress bars + zoom
- [ ] Mosaic: CSS columns masonry + image + title/description
- [ ] Gallery: aspect-square grid + image + hover effect
