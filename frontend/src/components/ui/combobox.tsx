'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  XIcon,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

// ============================================================================
// Root
// ============================================================================

const Combobox = ComboboxPrimitive.Root;

// ============================================================================
// Value
// ============================================================================

function ComboboxValue({
  ...props
}: ComboboxPrimitive.Value.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Value
      data-slot="combobox-value"
      {...props}
    />
  );
}

// ============================================================================
// Icon
// ============================================================================

function ComboboxIcon({
  className,
  ...props
}: ComboboxPrimitive.Icon.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Icon
      data-slot="combobox-icon"
      className={cn('flex', className)}
      {...props}
    >
      <ChevronDownIcon className="text-muted-foreground size-4" />
    </ComboboxPrimitive.Icon>
  );
}

// ============================================================================
// Trigger
// ============================================================================

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4" />
    </ComboboxPrimitive.Trigger>
  );
}

// ============================================================================
// Clear
// ============================================================================

function ComboboxClear({
  className,
  ...props
}: ComboboxPrimitive.Clear.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      className={cn(
        'text-muted-foreground hover:text-foreground flex size-6 items-center justify-center rounded transition-colors',
        className,
      )}
      {...props}
    >
      <XIcon className="pointer-events-none size-4" />
    </ComboboxPrimitive.Clear>
  );
}

// ============================================================================
// Input
// ============================================================================

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
}): React.JSX.Element {
  return (
    <InputGroup className={cn('w-auto', className)}>
      <ComboboxPrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <ComboboxPrimitive.Trigger
            data-slot="combobox-trigger"
            className="text-muted-foreground flex size-6 items-center justify-center rounded transition-colors hover:text-foreground data-pressed:bg-transparent"
            disabled={disabled}
          >
            <ChevronDownIcon className="pointer-events-none size-4" />
          </ComboboxPrimitive.Trigger>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

// ============================================================================
// Content (Portal + Positioner + Popup)
// ============================================================================

function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'
  >): React.JSX.Element {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            'bg-popover text-popover-foreground',
            'ring-foreground/10 rounded-md shadow-md ring-1',
            'max-h-72 min-w-36 overflow-hidden',
            'max-h-[var(--available-height)] w-[var(--anchor-width)] max-w-[var(--available-width)]',
            'min-w-[calc(var(--anchor-width)+1.75rem)]',
            'origin-[var(--transform-origin)]',
            'data-open:animate-in data-closed:animate-out',
            'data-closed:fade-out-0 data-open:fade-in-0',
            'data-closed:zoom-out-95 data-open:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2',
            'data-[side=top]:slide-in-from-bottom-2',
            'duration-100',
            '*:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0',
            '*:data-[slot=input-group]:h-8 *:data-[slot=input-group]:shadow-none',
            '*:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:border-input/30',
            'group/combobox-content relative',
            'data-[chips=true]:min-w-[var(--anchor-width)]',
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

// ============================================================================
// List
// ============================================================================

function ComboboxList({
  className,
  ...props
}: ComboboxPrimitive.List.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        'no-scrollbar max-h-[min(18rem,calc(var(--available-height)-2.25rem))]',
        'scroll-py-1 overflow-y-auto p-1 data-empty:p-0',
        'overscroll-contain',
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Item
// ============================================================================

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
        'not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground',
        'relative flex w-full cursor-default items-center gap-2',
        'rounded-sm py-1.5 pr-8 pl-2 text-sm',
        'outline-hidden select-none',
        "[&_svg:not([class*='size-'])]:size-4",
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
            <CheckIcon className="pointer-events-none" />
          </span>
        }
      />
    </ComboboxPrimitive.Item>
  );
}

// ============================================================================
// Group
// ============================================================================

function ComboboxGroup({
  className,
  ...props
}: ComboboxPrimitive.Group.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  );
}

// ============================================================================
// Label (GroupLabel)
// ============================================================================

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
      {...props}
    />
  );
}

// ============================================================================
// Collection
// ============================================================================

function ComboboxCollection({
  ...props
}: ComboboxPrimitive.Collection.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Collection
      data-slot="combobox-collection"
      {...props}
    />
  );
}

// ============================================================================
// Empty
// ============================================================================

function ComboboxEmpty({
  className,
  ...props
}: ComboboxPrimitive.Empty.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        'text-muted-foreground hidden w-full justify-center py-2 text-center text-sm',
        'group-data-empty/combobox-content:flex',
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Separator
// ============================================================================

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

// ============================================================================
// Chips (Multiple)
// ============================================================================

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        'dark:bg-input/30 border-input',
        'focus-within:border-ring focus-within:ring-ring/50',
        'has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40',
        'has-aria-invalid:border-destructive dark:has-aria-invalid:border-destructive/50',
        'flex min-h-9 flex-wrap items-center gap-1.5',
        'rounded-md border bg-transparent bg-clip-padding px-2.5 py-1.5 text-sm shadow-xs',
        'transition-[color,box-shadow] focus-within:ring-[3px] has-aria-invalid:ring-[3px]',
        'has-data-[slot=combobox-chip]:px-1.5',
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Chip
// ============================================================================

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
}): React.JSX.Element {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        'bg-muted text-foreground',
        'flex h-[calc(1.375rem)] w-fit items-center justify-center gap-1',
        'rounded-sm px-1.5 text-xs font-medium whitespace-nowrap',
        'has-data-[slot=combobox-chip-remove]:pr-0',
        'has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-5 p-0"
            >
              <XIcon className="pointer-events-none size-3" />
            </Button>
          }
        />
      )}
    </ComboboxPrimitive.Chip>
  );
}

// ============================================================================
// ChipsInput
// ============================================================================

function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn('min-w-16 flex-1 outline-none', className)}
      {...props}
    />
  );
}

// ============================================================================
// Status
// ============================================================================

function ComboboxStatus({
  className,
  ...props
}: ComboboxPrimitive.Status.Props): React.JSX.Element {
  return (
    <ComboboxPrimitive.Status
      data-slot="combobox-status"
      className={cn(
        'text-muted-foreground flex items-center gap-2 py-1 pl-4 pr-5 text-sm empty:hidden',
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Sortable Chips (DnD)
// ============================================================================

interface SortableChipItem {
  id: string;
  label: string;
}

interface ComboboxSortableChipsProps {
  items: Array<SortableChipItem>;
  onReorder: (items: Array<SortableChipItem>) => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function ComboboxSortableChips({
  items,
  onReorder,
  onRemove,
  disabled = false,
  className,
  children,
}: ComboboxSortableChipsProps): React.JSX.Element {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={horizontalListSortingStrategy}
        disabled={disabled}
      >
        <div
          data-slot="combobox-sortable-chips"
          className={cn(
            'dark:bg-input/30 border-input',
            'focus-within:border-ring focus-within:ring-ring/50',
            'has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40',
            'has-aria-invalid:border-destructive dark:has-aria-invalid:border-destructive/50',
            'flex min-h-9 flex-wrap items-center gap-1.5',
            'rounded-md border bg-transparent bg-clip-padding px-1.5 py-1.5 text-sm shadow-xs',
            'transition-[color,box-shadow] focus-within:ring-[3px] has-aria-invalid:ring-[3px]',
            className,
          )}
        >
          {items.map((item) => (
            <ComboboxSortableChip
              key={item.id}
              id={item.id}
              label={item.label}
              onRemove={onRemove}
              disabled={disabled}
            />
          ))}
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface ComboboxSortableChipProps {
  id: string;
  label: string;
  onRemove?: (id: string) => void;
  disabled?: boolean;
  className?: string;
}

function ComboboxSortableChip({
  id,
  label,
  onRemove,
  disabled = false,
  className,
}: ComboboxSortableChipProps): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slot="combobox-sortable-chip"
      className={cn(
        'bg-muted text-foreground',
        'flex h-[calc(1.375rem)] w-fit items-center justify-center gap-0.5',
        'rounded-sm pl-1 pr-0 text-xs font-medium whitespace-nowrap',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-0.5 opacity-50 hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-3" />
      </button>
      <span className="px-0.5">{label}</span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="size-5 p-0 opacity-50 hover:opacity-100"
          onClick={() => onRemove(id)}
          disabled={disabled}
        >
          <XIcon className="pointer-events-none size-3" />
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Hooks
// ============================================================================

function useComboboxAnchor(): React.RefObject<HTMLDivElement | null> {
  return React.useRef<HTMLDivElement | null>(null);
}

// ============================================================================
// Exports
// ============================================================================

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxSortableChips,
  ComboboxSortableChip,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxClear,
  ComboboxIcon,
  ComboboxStatus,
  useComboboxAnchor,
};

export type { SortableChipItem };
