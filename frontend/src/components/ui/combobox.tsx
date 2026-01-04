import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  Loader2Icon,
  XIcon,
} from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  fixed?: boolean;
}

export interface ComboboxGroup {
  label: string;
  options: Array<ComboboxOption>;
}

export interface ComboboxProps {
  // Valor e onChange
  value?: Array<ComboboxOption>;
  onChange?: (options: Array<ComboboxOption>) => void;

  // Opções (estáticas ou agrupadas)
  options?: Array<ComboboxOption>;
  groups?: Array<ComboboxGroup>;

  // Comportamento
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxSelected?: number;
  onMaxSelected?: (maxLimit: number) => void;

  // Creatable
  creatable?: boolean;
  onCreateOption?: (inputValue: string) => ComboboxOption | void;

  // Async
  onSearch?: (query: string) => void | Promise<void>;
  loading?: boolean;
  debounceMs?: number;

  // Reorder (dnd-kit)
  allowReorder?: boolean;

  // Customização
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

// ============================================================================
// Hooks
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect((): (() => void) => {
    const timer = setTimeout((): void => setDebouncedValue(value), delay);
    return (): void => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// Main Component
// ============================================================================

function Combobox({
  value = [],
  onChange,
  options = [],
  groups,
  placeholder = 'Selecione...',
  disabled = false,
  multiple = false,
  maxSelected = Number.MAX_SAFE_INTEGER,
  onMaxSelected,
  creatable = false,
  onCreateOption,
  onSearch,
  loading = false,
  debounceMs = 300,
  allowReorder = false,
  className,
  emptyMessage = 'Nenhum resultado encontrado.',
  loadingMessage = 'Carregando...',
}: ComboboxProps): React.JSX.Element {
  const [inputValue, setInputValue] = React.useState('');
  const debouncedInputValue = useDebounce(inputValue, debounceMs);

  // Chamar onSearch quando o valor debounced mudar
  React.useEffect(() => {
    if (onSearch) {
      void onSearch(debouncedInputValue);
    }
  }, [debouncedInputValue, onSearch]);

  // Combinar options e groups em uma lista flat
  const allOptions = React.useMemo(() => {
    if (groups) {
      return groups.flatMap((g) => g.options);
    }
    return options;
  }, [options, groups]);

  // Opções disponíveis (não selecionadas)
  const availableOptions = React.useMemo(() => {
    if (!multiple) return allOptions;
    return allOptions.filter(
      (opt) => !value.some((v) => v.value === opt.value),
    );
  }, [allOptions, value, multiple]);

  // Verificar se pode criar nova opção
  const canCreate = React.useMemo(() => {
    if (!creatable || !inputValue.trim()) return false;
    const normalizedInput = inputValue.trim().toLowerCase();
    const existsInOptions = allOptions.some(
      (opt) => opt.label.toLowerCase() === normalizedInput,
    );
    const existsInValue = value.some(
      (opt) => opt.label.toLowerCase() === normalizedInput,
    );
    return !existsInOptions && !existsInValue;
  }, [creatable, inputValue, allOptions, value]);

  // Handler para mudança de valor
  const handleValueChange = React.useCallback(
    (newValue: ComboboxOption | Array<ComboboxOption> | null) => {
      if (!onChange) return;

      if (multiple) {
        const newArray = newValue as Array<ComboboxOption>;
        if (newArray.length > maxSelected) {
          onMaxSelected?.(maxSelected);
          return;
        }
        onChange(newArray);
      } else {
        if (newValue === null) {
          onChange([]);
        } else {
          onChange([newValue as ComboboxOption]);
        }
      }
    },
    [onChange, multiple, maxSelected, onMaxSelected],
  );

  // Handler para criar nova opção
  const handleCreate = React.useCallback(() => {
    if (!canCreate) return;

    const trimmedValue = inputValue.trim();
    let newOption: ComboboxOption;

    if (onCreateOption) {
      const result = onCreateOption(trimmedValue);
      newOption = result || { value: trimmedValue, label: trimmedValue };
    } else {
      newOption = { value: trimmedValue, label: trimmedValue };
    }

    if (multiple) {
      if (value.length >= maxSelected) {
        onMaxSelected?.(maxSelected);
        return;
      }
      onChange?.([...value, newOption]);
    } else {
      onChange?.([newOption]);
    }
    setInputValue('');
  }, [
    canCreate,
    inputValue,
    onCreateOption,
    multiple,
    value,
    maxSelected,
    onMaxSelected,
    onChange,
  ]);

  // Handler para reordenar (dnd-kit)
  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = value.findIndex((v) => v.value === active.id);
      const newIndex = value.findIndex((v) => v.value === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newValue = [...value];
      const [removed] = newValue.splice(oldIndex, 1);
      newValue.splice(newIndex, 0, removed);

      onChange?.(newValue);
    },
    [value, onChange],
  );

  // Valor interno para o ComboboxPrimitive
  const internalValue = multiple ? value : (value[0] ?? null);

  // Items para o ComboboxPrimitive (incluindo item creatable)
  const items = React.useMemo(() => {
    const result = [...availableOptions];
    if (canCreate) {
      result.push({
        value: `__create__${inputValue.trim()}`,
        label: `Criar "${inputValue.trim()}"`,
      });
    }
    return result;
  }, [availableOptions, canCreate, inputValue]);

  return (
    <ComboboxPrimitive.Root
      data-slot="combobox"
      items={items}
      value={internalValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      multiple={multiple}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
    >
      {multiple ? (
        <MultipleComboboxTrigger
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          allowReorder={allowReorder}
          onDragEnd={handleDragEnd}
          onChange={onChange}
        />
      ) : (
        <SingleComboboxTrigger
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
      )}

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner
          data-slot="combobox-positioner"
          className="z-50 outline-none"
          sideOffset={4}
        >
          <ComboboxPrimitive.Popup
            data-slot="combobox-popup"
            className={cn(
              'bg-popover text-popover-foreground',
              'w-[var(--anchor-width)] max-h-[min(var(--available-height),18rem)]',
              'max-w-[var(--available-width)]',
              'origin-[var(--transform-origin)]',
              'overflow-hidden rounded-md border shadow-md',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
              'transition-[transform,opacity] duration-100',
            )}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                <span>{loadingMessage}</span>
              </div>
            ) : groups ? (
              <ComboboxGroupedList
                groups={groups}
                value={value}
                canCreate={canCreate}
                inputValue={inputValue}
                onCreateClick={handleCreate}
                emptyMessage={emptyMessage}
              />
            ) : (
              <ComboboxFlatList
                options={availableOptions}
                canCreate={canCreate}
                inputValue={inputValue}
                onCreateClick={handleCreate}
                emptyMessage={emptyMessage}
              />
            )}
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}

// ============================================================================
// Trigger Components
// ============================================================================

function SingleComboboxTrigger({
  value,
  placeholder,
  disabled,
  className,
}: {
  value: Array<ComboboxOption>;
  placeholder: string;
  disabled: boolean;
  className?: string;
}): React.JSX.Element {
  const selectedLabel = value[0]?.label ?? '';

  return (
    <div
      data-slot="combobox-trigger-wrapper"
      className={cn(
        'border-input bg-transparent',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        'flex w-full items-center justify-between gap-2',
        'rounded-md border px-3 py-2 text-sm shadow-xs',
        'transition-[color,box-shadow]',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        placeholder={selectedLabel || placeholder}
        disabled={disabled}
        className={cn(
          'flex-1 bg-transparent outline-none',
          'placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed',
          selectedLabel && 'placeholder:text-foreground',
        )}
      />
      <div className="flex items-center gap-1">
        {value.length > 0 && (
          <ComboboxPrimitive.Clear
            data-slot="combobox-clear"
            className={cn(
              'text-muted-foreground hover:text-foreground',
              'flex size-4 items-center justify-center rounded',
              'transition-colors',
            )}
            aria-label="Limpar seleção"
          >
            <XIcon className="size-3.5" />
          </ComboboxPrimitive.Clear>
        )}
        <ComboboxPrimitive.Trigger
          data-slot="combobox-trigger"
          className={cn(
            'text-muted-foreground',
            'flex size-4 items-center justify-center',
          )}
          aria-label="Abrir lista"
        >
          <ChevronDownIcon className="size-4 opacity-50" />
        </ComboboxPrimitive.Trigger>
      </div>
    </div>
  );
}

function MultipleComboboxTrigger({
  value,
  placeholder,
  disabled,
  className,
  allowReorder,
  onDragEnd,
  onChange,
}: {
  value: Array<ComboboxOption>;
  placeholder: string;
  disabled: boolean;
  className?: string;
  allowReorder: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onChange?: (options: Array<ComboboxOption>) => void;
}): React.JSX.Element {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleRemove = React.useCallback(
    (optionToRemove: ComboboxOption) => {
      if (optionToRemove.fixed) return;
      onChange?.(value.filter((v) => v.value !== optionToRemove.value));
    },
    [value, onChange],
  );

  const chipContent = (
    <>
      {value.map((item) =>
        allowReorder && !item.fixed ? (
          <SortableChip
            key={item.value}
            item={item}
            disabled={disabled}
            onRemove={handleRemove}
          />
        ) : (
          <StaticChip
            key={item.value}
            item={item}
            disabled={disabled}
            onRemove={handleRemove}
          />
        ),
      )}
    </>
  );

  return (
    <div
      data-slot="combobox-chips"
      className={cn(
        'border-input bg-transparent',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        'flex min-h-9 w-full flex-wrap items-center gap-1',
        'rounded-md border px-2 py-1.5 text-sm shadow-xs',
        'transition-[color,box-shadow]',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {allowReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={value.map((v) => v.value)}
            strategy={horizontalListSortingStrategy}
          >
            {chipContent}
          </SortableContext>
        </DndContext>
      ) : (
        chipContent
      )}
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        placeholder={value.length > 0 ? '' : placeholder}
        disabled={disabled}
        className={cn(
          'min-w-16 flex-1 bg-transparent outline-none',
          'placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed',
        )}
      />
      <ComboboxPrimitive.Trigger
        data-slot="combobox-trigger"
        className={cn(
          'text-muted-foreground ml-auto',
          'flex size-4 shrink-0 items-center justify-center',
        )}
        aria-label="Abrir lista"
      >
        <ChevronDownIcon className="size-4 opacity-50" />
      </ComboboxPrimitive.Trigger>
    </div>
  );
}

// ============================================================================
// Chip Components
// ============================================================================

function StaticChip({
  item,
  disabled,
  onRemove,
}: {
  item: ComboboxOption;
  disabled: boolean;
  onRemove: (item: ComboboxOption) => void;
}): React.JSX.Element {
  return (
    <div
      data-slot="combobox-chip"
      className={cn(
        'bg-secondary text-secondary-foreground',
        'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs',
        item.fixed && 'bg-muted text-muted-foreground',
      )}
    >
      <span>{item.label}</span>
      {!item.fixed && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(item);
          }}
          className={cn(
            'hover:bg-secondary-foreground/20 rounded p-0.5',
            'transition-colors',
          )}
          aria-label="Remover"
        >
          <XIcon className="size-3" />
        </button>
      )}
    </div>
  );
}

function SortableChip({
  item,
  disabled,
  onRemove,
}: {
  item: ComboboxOption;
  disabled: boolean;
  onRemove: (item: ComboboxOption) => void;
}): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.value });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slot="combobox-chip"
      className={cn(
        'bg-secondary text-secondary-foreground',
        'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs',
        isDragging && 'opacity-50',
      )}
    >
      {!disabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none"
        >
          <GripVerticalIcon className="size-3 text-muted-foreground" />
        </button>
      )}
      <span>{item.label}</span>
      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(item);
          }}
          className={cn(
            'hover:bg-secondary-foreground/20 rounded p-0.5',
            'transition-colors',
          )}
          aria-label="Remover"
        >
          <XIcon className="size-3" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// List Components
// ============================================================================

function ComboboxFlatList({
  options,
  canCreate,
  inputValue,
  onCreateClick,
  emptyMessage,
}: {
  options: Array<ComboboxOption>;
  canCreate: boolean;
  inputValue: string;
  onCreateClick: () => void;
  emptyMessage: string;
}): React.JSX.Element {
  return (
    <>
      {!canCreate && options.length === 0 && (
        <div className="text-muted-foreground p-3 text-center text-sm">
          {emptyMessage}
        </div>
      )}
      <ComboboxPrimitive.List
        data-slot="combobox-list"
        className="max-h-[min(18rem,var(--available-height))] overflow-y-auto p-1"
      >
        {canCreate && (
          <div
            role="option"
            data-slot="combobox-create-item"
            className={cn(
              'hover:bg-accent hover:text-accent-foreground',
              'relative flex w-full cursor-pointer items-center gap-2',
              'rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none',
            )}
            onClick={onCreateClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCreateClick();
            }}
            tabIndex={0}
          >
            <span>Criar "{inputValue.trim()}"</span>
          </div>
        )}
        {options
          .filter((item) => !item.value.startsWith('__create__'))
          .map((item) => (
            <ComboboxPrimitive.Item
              key={item.value}
              value={item}
              data-slot="combobox-item"
              disabled={item.disabled}
              className={cn(
                'focus:bg-accent focus:text-accent-foreground',
                'relative flex w-full cursor-default items-center gap-2',
                'rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none',
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
              )}
            >
              <ComboboxPrimitive.ItemIndicator
                data-slot="combobox-item-indicator"
                className="absolute right-2 flex size-3.5 items-center justify-center"
              >
                <CheckIcon className="size-4" />
              </ComboboxPrimitive.ItemIndicator>
              <span>{item.label}</span>
            </ComboboxPrimitive.Item>
          ))}
      </ComboboxPrimitive.List>
    </>
  );
}

function ComboboxGroupedList({
  groups,
  value,
  canCreate,
  inputValue,
  onCreateClick,
  emptyMessage,
}: {
  groups: Array<ComboboxGroup>;
  value: Array<ComboboxOption>;
  canCreate: boolean;
  inputValue: string;
  onCreateClick: () => void;
  emptyMessage: string;
}): React.JSX.Element {
  // Filtrar opções já selecionadas de cada grupo
  const filteredGroups = React.useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (opt) => !value.some((v) => v.value === opt.value),
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, value]);

  const hasOptions =
    filteredGroups.some((g) => g.options.length > 0) || canCreate;

  return (
    <>
      {!hasOptions && (
        <div className="text-muted-foreground p-3 text-center text-sm">
          {emptyMessage}
        </div>
      )}
      <div className="max-h-[min(18rem,var(--available-height))] overflow-y-auto p-1">
        {canCreate && (
          <div
            role="option"
            data-slot="combobox-create-item"
            className={cn(
              'hover:bg-accent hover:text-accent-foreground',
              'relative flex w-full cursor-pointer items-center gap-2',
              'rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none',
            )}
            onClick={onCreateClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCreateClick();
            }}
            tabIndex={0}
          >
            <span>Criar "{inputValue.trim()}"</span>
          </div>
        )}
        {filteredGroups.map((group) => (
          <ComboboxPrimitive.Group key={group.label}>
            <ComboboxPrimitive.GroupLabel
              data-slot="combobox-group-label"
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {group.label}
            </ComboboxPrimitive.GroupLabel>
            {group.options.map((item) => (
              <ComboboxPrimitive.Item
                key={item.value}
                value={item}
                data-slot="combobox-item"
                disabled={item.disabled}
                className={cn(
                  'focus:bg-accent focus:text-accent-foreground',
                  'relative flex w-full cursor-default items-center gap-2',
                  'rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                )}
              >
                <ComboboxPrimitive.ItemIndicator
                  data-slot="combobox-item-indicator"
                  className="absolute right-2 flex size-3.5 items-center justify-center"
                >
                  <CheckIcon className="size-4" />
                </ComboboxPrimitive.ItemIndicator>
                <span>{item.label}</span>
              </ComboboxPrimitive.Item>
            ))}
          </ComboboxPrimitive.Group>
        ))}
      </div>
    </>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { Combobox };
