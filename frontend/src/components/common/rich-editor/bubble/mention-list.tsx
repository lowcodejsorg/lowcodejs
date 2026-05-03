import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export interface MentionItem {
  id: string;
  label: string;
  email?: string;
}

export interface MentionListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface MentionListProps {
  items: Array<MentionItem>;
  command: (item: MentionItem) => void;
}

function getInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return trimmed.charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const selectItem = (index: number): boolean => {
      const item = items[index];
      if (!item) return false;
      command(item);
      return true;
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent): boolean => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex(
            (current) =>
              (current + items.length - 1) % Math.max(items.length, 1),
          );
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex(
            (current) => (current + 1) % Math.max(items.length, 1),
          );
          return true;
        }
        if (event.key === 'Enter') {
          return selectItem(selectedIndex);
        }
        return false;
      },
    }));

    return (
      <div
        data-slot="mention-list"
        data-test-id="mention-list"
        className="bg-popover text-popover-foreground rounded-md border shadow-md w-72 max-h-72 overflow-y-auto py-1"
      >
        {items.length === 0 && (
          <div
            data-test-id="mention-list-empty"
            className="px-3 py-2 text-xs text-muted-foreground"
          >
            Nenhum usuário encontrado
          </div>
        )}
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            data-test-id="mention-list-item"
            data-active={index === selectedIndex || undefined}
            onMouseEnter={() => setSelectedIndex(index)}
            onMouseDown={(event) => {
              event.preventDefault();
              selectItem(index);
            }}
            className={
              'w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer text-left ' +
              (index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground')
            }
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">
                {getInitials(item.label)}
              </AvatarFallback>
            </Avatar>
            <span className="flex flex-col flex-1 min-w-0">
              <span className="font-medium truncate">{item.label}</span>
              {item.email && (
                <span className="text-xs text-muted-foreground truncate">
                  {item.email}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    );
  },
);

MentionList.displayName = 'MentionList';
