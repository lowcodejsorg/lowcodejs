import React from 'react';

import { KanbanCard } from './kanban-card';

import { Badge } from '@/components/ui/badge';
import type { IRow } from '@/lib/interfaces';
import type { FieldMap } from '@/lib/kanban-types';

export function KanbanUnassignedColumn({
  rows,
  fields,
  onSelectRow,
}: {
  rows: Array<IRow>;
  fields: FieldMap;
  onSelectRow: (row: IRow) => void;
}): React.JSX.Element | null {
  if (rows.length === 0) return null;

  return (
    <section
      data-slot="kanban-unassigned-column"
      className="w-72 shrink-0 rounded-xl border bg-muted/30 overflow-hidden flex flex-col h-full min-h-0"
    >
      <div className="flex items-center justify-between border-b bg-background/60 px-4 py-3">
        <div className="text-base font-semibold">Sem lista</div>
        <Badge variant="outline">{rows.length}</Badge>
      </div>
      <div className="space-y-3 px-4 pb-4 pt-3 flex-1 min-h-0 overflow-y-auto kanban-scroll">
        {rows.map((row) => (
          <KanbanCard
            key={row._id}
            row={row}
            fields={fields}
            onClick={() => onSelectRow(row)}
          />
        ))}
      </div>
    </section>
  );
}
