import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon } from 'lucide-react';
import React from 'react';

import { badgeStyleFromColor } from '@/components/common/table-row-badge-list';
import { Badge } from '@/components/ui/badge';
import {
  columnHeaderStyleFromColor,
  columnStyleFromColor,
} from '@/lib/kanban-helpers';
import { cn } from '@/lib/utils';

export function KanbanColumn({
  option,
  count,
  children,
  editingColumnId,
  editingColumnLabel,
  editingColumnColor,
  onEditStart,
  onEditChange,
  onEditColorChange,
  onEditCancel,
  onEditCommit,
}: {
  option: { id: string; label: string; color?: string | null };
  count: number;
  children: React.ReactNode;
  editingColumnId: string | null;
  editingColumnLabel: string;
  editingColumnColor: string | null;
  onEditStart: (option: { id: string; label: string }) => void;
  onEditChange: (value: string) => void;
  onEditColorChange: (value: string) => void;
  onEditCancel: () => void;
  onEditCommit: (
    optionId: string,
    nextLabel: string,
    nextColor: string | null,
  ) => void;
}): React.JSX.Element {
  const colorInputRef = React.useRef<HTMLInputElement | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: option.id,
    data: { type: 'column', columnId: option.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const columnStyle = columnStyleFromColor(option.color);

  return (
    <section
      ref={setNodeRef}
      style={{ ...style, ...columnStyle }}
      className={cn(
        'w-72 shrink-0 rounded-md border bg-muted/30 overflow-hidden',
        isDragging && 'opacity-80',
      )}
    >
      <div
        className="flex items-center justify-between border-b bg-background/60 px-4 py-3"
        style={columnHeaderStyleFromColor(option.color)}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab text-muted-foreground hover:text-foreground"
            aria-label="Arrastar lista"
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon className="size-4" />
          </button>
          {editingColumnId === option.id ? (
            <div className="flex items-center gap-2">
              <input
                value={editingColumnLabel}
                onChange={(event) => onEditChange(event.target.value)}
                onBlur={(event) => {
                  if (event.relatedTarget === colorInputRef.current) return;
                  const nextLabel = editingColumnLabel.trim();
                  const nextColor = editingColumnColor ?? option.color ?? null;
                  const labelChanged = nextLabel && nextLabel !== option.label;
                  const colorChanged = nextColor !== (option.color ?? null);
                  if (!labelChanged && !colorChanged) {
                    onEditCancel();
                    return;
                  }
                  if (!nextLabel) {
                    onEditCancel();
                    return;
                  }
                  onEditCommit(option.id, nextLabel, nextColor);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    (event.target as HTMLInputElement).blur();
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    onEditCancel();
                  }
                }}
                autoFocus
                className="w-40 rounded-md border border-input bg-background px-2 py-1 text-base font-semibold focus:outline-none"
              />
              <input
                type="color"
                value={editingColumnColor ?? option.color ?? '#64748b'}
                onChange={(event) => onEditColorChange(event.target.value)}
                onBlur={() => {
                  const nextLabel = editingColumnLabel.trim();
                  const nextColor = editingColumnColor ?? option.color ?? null;
                  const labelChanged = nextLabel && nextLabel !== option.label;
                  const colorChanged = nextColor !== (option.color ?? null);
                  if (!labelChanged && !colorChanged) {
                    onEditCancel();
                    return;
                  }
                  if (!nextLabel) {
                    onEditCancel();
                    return;
                  }
                  onEditCommit(option.id, nextLabel, nextColor);
                }}
                className="h-7 w-10 rounded border bg-transparent p-0"
                aria-label="Cor da coluna"
                ref={colorInputRef}
              />
            </div>
          ) : (
            <button
              type="button"
              className="text-base font-semibold cursor-pointer"
              onDoubleClick={() => {
                onEditStart(option);
              }}
            >
              {option.label}
            </button>
          )}
        </div>
        <Badge
          variant="outline"
          style={badgeStyleFromColor(option.color)}
        >
          {count}
        </Badge>
      </div>
      <div className="space-y-3 px-2 pb-2 pt-2">{children}</div>
    </section>
  );
}
