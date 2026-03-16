import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Header } from '@tanstack/react-table';
import { GripVerticalIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface DataTableDraggableHeaderProps<TData> {
  header: Header<TData, unknown>;
  children: React.ReactNode;
}

export function DataTableDraggableHeader<TData>({
  header,
  children,
}: DataTableDraggableHeaderProps<TData>): React.JSX.Element {
  const canDrag = header.column.getCanHide();
  const isPinned = header.column.getIsPinned();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.column.id,
    disabled: !canDrag || !!isPinned,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-0.5"
    >
      {canDrag && !isPinned && (
        <button
          type="button"
          className={cn(
            'opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing',
            'p-0.5 -ml-1 rounded hover:bg-muted transition-opacity',
          )}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-3 text-muted-foreground" />
        </button>
      )}
      {children}
    </div>
  );
}
