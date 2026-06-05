import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

import { TableRowDateCell } from '@/components/common/dynamic-table/table-cells/table-row-date-cell';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { IRow } from '@/lib/interfaces';
import {
  getMembersFromRow,
  getProgressValue,
  getTitleValue,
  getUserInitials,
} from '@/lib/kanban-helpers';
import type { FieldMap } from '@/lib/kanban-types';
import { cn } from '@/lib/utils';

export interface KanbanCardProps {
  row: IRow;
  fields: FieldMap;
  onClick: () => void;
  onFieldClick?: (field: 'members' | 'start' | 'due' | 'list') => void;
}

export function KanbanCard({
  row,
  fields,
  onClick,
  onFieldClick,
}: KanbanCardProps): React.JSX.Element {
  const title = getTitleValue(row, fields.title);
  const progress = getProgressValue(row, fields.progress);
  const members = getMembersFromRow(row, fields.members);

  const handleFieldClick = (
    fieldType: 'members' | 'start' | 'due' | 'list',
    event: React.MouseEvent,
  ): void => {
    event.stopPropagation();
    onFieldClick?.(fieldType);
  };

  return (
    <button
      data-slot="kanban-card"
      data-test-id={`kanban-card-${row._id}`}
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-md border bg-background p-3 shadow-sm hover:shadow-md transition cursor-pointer"
    >
      {row.status === 'draft' && (
        <Badge
          variant="outline"
          className="mb-1 text-amber-600 border-amber-400"
        >
          Rascunho
        </Badge>
      )}
      <div className="text-sm font-semibold line-clamp-2">{title}</div>

      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <div
            className={cn(
              'gap-2',
              fields.startDate && fields.dueDate && 'grid grid-cols-2',
              !(fields.startDate && fields.dueDate) && 'flex flex-col gap-1',
            )}
          >
            {fields.startDate && (
              <button
                type="button"
                onClick={(e) => handleFieldClick('start', e)}
                className="min-w-0 hover:underline text-left"
              >
                <span className="mr-1">Início:</span>
                <TableRowDateCell
                  row={row}
                  field={fields.startDate}
                />
              </button>
            )}
            {fields.dueDate && (
              <button
                type="button"
                onClick={(e) => handleFieldClick('due', e)}
                className="min-w-0 hover:underline text-left"
              >
                <span className="mr-1">Venc.:</span>
                <TableRowDateCell
                  row={row}
                  field={fields.dueDate}
                />
              </button>
            )}
            {!fields.startDate && !fields.dueDate && <span>-</span>}
          </div>
        </div>
        <div
          className="flex -space-x-2"
          onClick={(e) => {
            if (fields.members) {
              handleFieldClick('members', e);
            }
          }}
          role="button"
          tabIndex={fields.members ? 0 : -1}
        >
          {members.slice(0, 3).map((member, index) => (
            <Avatar
              key={index}
              className="h-6 w-6 border border-background"
            >
              <AvatarFallback className="text-[10px]">
                {getUserInitials(member)}
              </AvatarFallback>
            </Avatar>
          ))}
          {members.length > 3 && (
            <span className="ml-2 text-xs text-muted-foreground">
              +{members.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span>{progress ?? 0}%</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
      </div>
    </button>
  );
}

export function KanbanSortableCard({
  row,
  fields,
  onClick,
  onFieldClick,
  columnId,
}: {
  row: IRow;
  fields: FieldMap;
  onClick: () => void;
  onFieldClick?: (field: 'members' | 'start' | 'due' | 'list') => void;
  columnId: string;
}): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row._id,
    data: { type: 'card', columnId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      data-slot="kanban-sortable-card"
      data-test-id={`kanban-sortable-card-${row._id}`}
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-70')}
      {...attributes}
      {...listeners}
    >
      <KanbanCard
        row={row}
        fields={fields}
        onClick={onClick}
        onFieldClick={onFieldClick}
      />
    </div>
  );
}
