import {
  MessageCircle,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react';
import React from 'react';

import type { IField, IRow } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface ForumSidebarProps {
  rows: Array<IRow>;
  activeRowId: string | null;
  channelField?: IField | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onAddChannel: () => void;
  onSelectRow: (rowId: string) => void;
  onEditRow: (row: IRow) => void;
  onDeleteRow: (row: IRow) => void;
}

export function ForumSidebar({
  rows,
  activeRowId,
  channelField,
  isOpen,
  onToggleOpen,
  onAddChannel,
  onSelectRow,
  onEditRow,
  onDeleteRow,
}: ForumSidebarProps): React.JSX.Element {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 bg-background border-r h-svh flex flex-col relative md:sticky md:top-0 md:h-full md:inset-auto md:z-0',
        'transition-all duration-300',
        isOpen ? 'w-64' : 'w-10',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-2 py-2',
          isOpen && 'border-b',
        )}
      >
        {isOpen ? (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <MessageCircle className="size-4" />
              <span>Canais</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1 rounded hover:bg-muted/60 cursor-pointer"
                onClick={onAddChannel}
                aria-label="Adicionar canal"
              >
                <PlusIcon className="size-4" />
              </button>
              <button
                onClick={onToggleOpen}
                className="p-1 rounded hover:bg-muted/60 cursor-pointer"
                aria-label="Ocultar sidebar"
              >
                <PanelLeftCloseIcon className="size-5" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onToggleOpen}
            className="p-1 rounded hover:bg-muted/60 cursor-pointer mx-auto"
            aria-label="Mostrar sidebar"
          >
            <PanelLeftOpenIcon className="size-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="flex-1 overflow-auto space-y-1 px-3 pb-3 pt-2">
          {rows.map((row) => {
            const label = channelField
              ? String(row[channelField.slug] ?? 'Canal sem nome')
              : row._id;
            const isActive = row._id === activeRowId;
            return (
              <button
                key={row._id}
                type="button"
                className={cn(
                  'group w-full flex items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors cursor-pointer',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
                onClick={() => onSelectRow(row._id)}
              >
                <span className="font-medium">#</span>
                <span className="truncate">{label}</span>
                <span className="ml-auto flex items-center gap-1 opacity-0 transition pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-muted/60 cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditRow(row);
                    }}
                    aria-label="Editar canal"
                  >
                    <PencilIcon className="size-3" />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-muted/60 cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteRow(row);
                    }}
                    aria-label="Excluir canal"
                  >
                    <TrashIcon className="size-3" />
                  </button>
                </span>
              </button>
            );
          })}
          {rows.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhum canal criado.
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
