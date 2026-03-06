import type {
  ColumnOrderState,
  ColumnSizingState,
  VisibilityState,
} from '@tanstack/react-table';
import React from 'react';

interface PersistedTableState {
  columnVisibility?: VisibilityState;
  columnOrder?: ColumnOrderState;
  columnSizing?: ColumnSizingState;
}

const STORAGE_PREFIX = 'dt:';

function loadState(key: string): PersistedTableState {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedTableState;
  } catch {
    return {};
  }
}

function saveState(key: string, state: PersistedTableState): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

interface UsePersistedTableStateOptions {
  persistKey?: string;
  initialColumnVisibility?: VisibilityState;
  initialColumnOrder?: ColumnOrderState;
  initialColumnSizing?: ColumnSizingState;
}

export function usePersistedTableState({
  persistKey,
  initialColumnVisibility = {},
  initialColumnOrder = [],
  initialColumnSizing = {},
}: UsePersistedTableStateOptions): {
  columnVisibility: VisibilityState;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  columnOrder: ColumnOrderState;
  setColumnOrder: React.Dispatch<React.SetStateAction<ColumnOrderState>>;
  columnSizing: ColumnSizingState;
  setColumnSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>;
} {
  const enabled = !!persistKey;

  const persisted = React.useRef(enabled ? loadState(persistKey) : {});

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => ({
      ...initialColumnVisibility,
      ...(enabled ? persisted.current.columnVisibility : {}),
    }));

  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(() =>
    enabled && persisted.current.columnOrder?.length
      ? persisted.current.columnOrder
      : initialColumnOrder,
  );

  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(
    () => ({
      ...initialColumnSizing,
      ...(enabled ? persisted.current.columnSizing : {}),
    }),
  );

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveState(persistKey, { columnVisibility, columnOrder, columnSizing });
    }, 300);

    return (): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, persistKey, columnVisibility, columnOrder, columnSizing]);

  return {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
  };
}
