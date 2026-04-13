---
name: maiyu:frontend-kanban
description: |
  Generates Kanban board components with drag-and-drop columns and cards.
  Use when: user asks to create kanban boards, task boards, drag-drop columns,
  or mentions "kanban", "board", "drag and drop cards".
  Supports: dnd-kit, column/card drag, create/edit dialogs.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Conventions

### Rules
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Types

```typescript
export interface KanbanCard {
  id: string
  title: string
  description?: string
  columnId: string
}

export interface KanbanColumn {
  id: string
  title: string
  color?: string
}
```

### Kanban Board

```tsx
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanColumn } from './kanban-column'

interface KanbanBoardProps {
  columns: KanbanColumn[]
  cards: KanbanCard[]
  onCardMove: (cardId: string, toColumnId: string) => void
  onCardCreate?: (columnId: string) => void
  onCardClick?: (card: KanbanCard) => void
}

export function KanbanBoard({
  columns,
  cards,
  onCardMove,
  onCardCreate,
  onCardClick,
}: KanbanBoardProps): React.JSX.Element {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const cardId = active.id as string
    const targetColumnId = over.id as string

    if (cardId !== targetColumnId) {
      onCardMove(cardId, targetColumnId)
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {columns.map((column) => {
          const columnCards = cards.filter((c) => c.columnId === column.id)
          return (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              cards={columnCards}
              onCardCreate={() => onCardCreate?.(column.id)}
              onCardClick={onCardClick}
            />
          )
        })}
      </div>
    </DndContext>
  )
}
```

### Kanban Column

```tsx
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { KanbanCardComponent } from './kanban-card'

interface KanbanColumnProps {
  column: KanbanColumn
  cards: KanbanCard[]
  onCardCreate?: () => void
  onCardClick?: (card: KanbanCard) => void
}

function KanbanColumnComponent({
  column,
  cards,
  onCardCreate,
  onCardClick,
}: KanbanColumnProps): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-lg bg-muted/50 p-2',
        isOver && 'ring-2 ring-primary/20',
      )}
    >
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <h3 className="text-sm font-medium">{column.title}</h3>
        <span className="text-xs text-muted-foreground">{cards.length}</span>
      </div>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[40px]">
          {cards.map((card) => (
            <KanbanCardComponent key={card.id} card={card} onClick={() => onCardClick?.(card)} />
          ))}
        </div>
      </SortableContext>
      {onCardCreate && (
        <button
          onClick={onCardCreate}
          className="flex items-center gap-1 px-2 py-1.5 mt-2 text-sm text-muted-foreground hover:text-foreground rounded hover:bg-muted"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      )}
    </div>
  )
}
```

### Kanban Card

```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface KanbanCardProps {
  card: KanbanCard
  onClick?: () => void
}

function KanbanCardComponent({ card, onClick }: KanbanCardProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-2 rounded-md border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'opacity-50',
      )}
      onClick={onClick}
    >
      <button {...attributes} {...listeners} className="shrink-0 mt-0.5 cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{card.title}</p>
        {card.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
        )}
      </div>
    </div>
  )
}
```

## Checklist

- [ ] dnd-kit for drag-and-drop
- [ ] Droppable columns with visual feedback
- [ ] Sortable cards within columns
- [ ] Card count per column
- [ ] Add card button per column
- [ ] Card click handler for detail view
- [ ] Responsive horizontal scroll
