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

export interface ComboboxProps<T = ComboboxOption> {
  /** Lista de itens */
  items?: Array<T>;
  /** Valor selecionado (IDs) */
  value?: Array<string>;
  /** Callback quando valor muda */
  onChange?: (value: Array<string>, items: Array<T>) => void;

  /** Extrai o ID único do item (default: item.value) */
  getItemId?: (item: T) => string;
  /** Extrai o label de exibição do item (default: item.label) */
  getItemLabel?: (item: T) => string;
  /** Extrai o valor de busca do item (default: label) */
  getItemSearchValue?: (item: T) => string;
  /** Renderiza o conteúdo do item na lista */
  renderItem?: (item: T) => React.ReactNode;

  /** Grupos de opções (para organizar itens) */
  groups?: Array<ComboboxGroup>;

  // Comportamento
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxSelected?: number;
  onMaxSelected?: (maxLimit: number) => void;

  // Creatable
  creatable?: boolean;
  onCreateOption?: (inputValue: string) => T | void;

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
  /** Limite de badges exibidos no trigger (modo multiple) */
  maxBadges?: number;
  /** Exibe checkboxes nos itens (modo multiple) */
  showCheckboxes?: boolean;
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

function Combobox<T = ComboboxOption>({
  items = [],
  value = [],
  onChange,
  getItemId: getItemIdProp,
  getItemLabel: getItemLabelProp,
  getItemSearchValue: _getItemSearchValue,
  renderItem,
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
  maxBadges,
  showCheckboxes = false,
}: ComboboxProps<T>): React.JSX.Element {
  const [inputValue, setInputValue] = React.useState('');
  const debouncedInputValue = useDebounce(inputValue, debounceMs);

  // Defaults para getters (assume ComboboxOption se não fornecido)
  const getItemId = React.useCallback(
    (item: T): string => {
      if (getItemIdProp) return getItemIdProp(item);
      return (item as unknown as ComboboxOption).value;
    },
    [getItemIdProp],
  );

  const getItemLabel = React.useCallback(
    (item: T): string => {
      if (getItemLabelProp) return getItemLabelProp(item);
      return (item as unknown as ComboboxOption).label;
    },
    [getItemLabelProp],
  );

  // Converter items para formato interno (ComboboxOption com _item)
  const allItems = React.useMemo(() => {
    const baseItems = groups
      ? groups.flatMap((g) => g.options as unknown as Array<T>)
      : items;

    return baseItems.map((item) => ({
      value: getItemId(item),
      label: getItemLabel(item),
      _item: item,
    }));
  }, [items, groups, getItemId, getItemLabel]);

  // Items selecionados (baseado em value = array de IDs)
  const selectedItems = React.useMemo(() => {
    return allItems.filter((item) => value.includes(item.value));
  }, [allItems, value]);

  // Chamar onSearch quando o valor debounced mudar
  React.useEffect(() => {
    if (onSearch) {
      void onSearch(debouncedInputValue);
    }
  }, [debouncedInputValue, onSearch]);

  // Opções disponíveis (não selecionadas, com _item para renderItem)
  const availableOptions = React.useMemo(() => {
    const opts = allItems.map((item) => ({
      value: item.value,
      label: item.label,
      _item: item._item,
    }));
    if (!multiple) return opts;
    return opts.filter((opt) => !value.includes(opt.value));
  }, [allItems, value, multiple]);

  // Verificar se pode criar nova opção
  const canCreate = React.useMemo(() => {
    if (!creatable || !inputValue.trim()) return false;
    const normalizedInput = inputValue.trim().toLowerCase();
    const existsInOptions = allItems.some(
      (opt) => opt.label.toLowerCase() === normalizedInput,
    );
    const existsInSelected = selectedItems.some(
      (item) => item.label.toLowerCase() === normalizedInput,
    );
    return !existsInOptions && !existsInSelected;
  }, [creatable, inputValue, allItems, selectedItems]);

  // Helper para chamar onChange com IDs e items originais
  const emitChange = React.useCallback(
    (newIds: Array<string>) => {
      if (!onChange) return;
      const newItems = allItems
        .filter((item) => newIds.includes(item.value))
        .map((item) => item._item);
      onChange(newIds, newItems);
    },
    [onChange, allItems],
  );

  // Handler para mudança de valor (do primitivo)
  const handleValueChange = React.useCallback(
    (newValue: ComboboxOption | Array<ComboboxOption> | null) => {
      if (!onChange) return;

      if (multiple) {
        const newArray = newValue as Array<ComboboxOption>;
        if (newArray.length > maxSelected) {
          onMaxSelected?.(maxSelected);
          return;
        }
        emitChange(newArray.map((opt) => opt.value));
      } else {
        if (newValue === null) {
          emitChange([]);
        } else {
          emitChange([(newValue as ComboboxOption).value]);
        }
      }
    },
    [onChange, multiple, maxSelected, onMaxSelected, emitChange],
  );

  // Handler para criar nova opção
  const handleCreate = React.useCallback(() => {
    if (!canCreate) return;

    const trimmedValue = inputValue.trim();
    let newItem: T;

    if (onCreateOption) {
      const result = onCreateOption(trimmedValue);
      newItem =
        result ||
        ({ value: trimmedValue, label: trimmedValue } as unknown as T);
    } else {
      newItem = { value: trimmedValue, label: trimmedValue } as unknown as T;
    }

    const newId = getItemId(newItem);

    if (multiple) {
      if (value.length >= maxSelected) {
        onMaxSelected?.(maxSelected);
        return;
      }
      const newIds = [...value, newId];
      const newItems = [
        ...allItems.filter((i) => value.includes(i.value)).map((i) => i._item),
        newItem,
      ];
      onChange?.(newIds, newItems);
    } else {
      onChange?.([newId], [newItem]);
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
    getItemId,
    allItems,
  ]);

  // Handler para reordenar (dnd-kit)
  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = value.findIndex((id) => id === active.id);
      const newIndex = value.findIndex((id) => id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newIds = [...value];
      const [removed] = newIds.splice(oldIndex, 1);
      newIds.splice(newIndex, 0, removed);

      emitChange(newIds);
    },
    [value, emitChange],
  );

  // Valor selecionado como ComboboxOption para triggers
  const selectedAsOptions = React.useMemo(() => {
    return selectedItems.map((item) => ({
      value: item.value,
      label: item.label,
    }));
  }, [selectedItems]);

  // Valor interno para o ComboboxPrimitive (ComboboxOption ou array)
  const internalValue = multiple
    ? selectedAsOptions
    : (selectedAsOptions[0] ?? null);

  // Items para o ComboboxPrimitive (incluindo item creatable)
  const primitiveItems = React.useMemo((): Array<
    ComboboxOption & { _item?: T }
  > => {
    const result: Array<ComboboxOption & { _item?: T }> = [...availableOptions];
    if (canCreate) {
      result.push({
        value: `__create__${inputValue.trim()}`,
        label: `Criar "${inputValue.trim()}"`,
      });
    }
    return result;
  }, [availableOptions, canCreate, inputValue]);

  // Handler para remover item (usado pelos triggers)
  const handleRemove = React.useCallback(
    (optionToRemove: ComboboxOption) => {
      const newIds = value.filter((id) => id !== optionToRemove.value);
      emitChange(newIds);
    },
    [value, emitChange],
  );

  return (
    <ComboboxPrimitive.Root
      data-slot="combobox"
      items={primitiveItems}
      value={internalValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      multiple={multiple}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
    >
      {multiple ? (
        <MultipleComboboxTrigger
          value={selectedAsOptions}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          allowReorder={allowReorder}
          onDragEnd={handleDragEnd}
          onRemove={handleRemove}
          maxBadges={maxBadges}
        />
      ) : (
        <SingleComboboxTrigger
          value={selectedAsOptions}
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
                value={selectedAsOptions}
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
                showCheckboxes={showCheckboxes && multiple}
                renderItem={renderItem}
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
  onRemove,
  maxBadges,
}: {
  value: Array<ComboboxOption>;
  placeholder: string;
  disabled: boolean;
  className?: string;
  allowReorder: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onRemove: (option: ComboboxOption) => void;
  maxBadges?: number;
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
      onRemove(optionToRemove);
    },
    [onRemove],
  );

  // Limitar badges exibidos se maxBadges definido
  const displayItems = maxBadges ? value.slice(0, maxBadges) : value;
  const remaining =
    maxBadges && value.length > maxBadges ? value.length - maxBadges : 0;

  const chipContent = (
    <>
      {displayItems.map((item) =>
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
      {remaining > 0 && (
        <div className="bg-muted text-muted-foreground flex items-center rounded px-1.5 py-0.5 text-xs">
          +{remaining}
        </div>
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

function ComboboxFlatList<T>({
  options,
  canCreate,
  inputValue,
  onCreateClick,
  emptyMessage,
  showCheckboxes = false,
  renderItem,
}: {
  options: Array<ComboboxOption & { _item?: T }>;
  canCreate: boolean;
  inputValue: string;
  onCreateClick: () => void;
  emptyMessage: string;
  showCheckboxes?: boolean;
  renderItem?: (item: T) => React.ReactNode;
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
              {showCheckboxes ? (
                <ComboboxPrimitive.ItemIndicator
                  data-slot="combobox-item-indicator"
                  className="flex size-4 items-center justify-center rounded border border-primary data-[selected]:bg-primary data-[selected]:text-primary-foreground"
                  keepMounted
                >
                  <CheckIcon className="size-3" />
                </ComboboxPrimitive.ItemIndicator>
              ) : (
                <ComboboxPrimitive.ItemIndicator
                  data-slot="combobox-item-indicator"
                  className="absolute right-2 flex size-3.5 items-center justify-center"
                >
                  <CheckIcon className="size-4" />
                </ComboboxPrimitive.ItemIndicator>
              )}
              {renderItem && item._item ? (
                renderItem(item._item)
              ) : (
                <span className="flex-1">{item.label}</span>
              )}
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
