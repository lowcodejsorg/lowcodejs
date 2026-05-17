import type { AnyFormApi } from '@tanstack/form-core';
import { useStore } from '@tanstack/react-form';
import React from 'react';

import { useCreateTableRow } from '@/hooks/tanstack-query/use-table-row-create';
import { useUpdateTableRow } from '@/hooks/tanstack-query/use-table-row-update';
import type { IField } from '@/lib/interfaces';
import { buildRowPayload } from '@/lib/table';
import type { CreateRowDefaultValue } from '@/lib/table';
import { toastError } from '@/lib/toast';

// ─── helpers ────────────────────────────────────────────────────────────────

function isFileValue(v: unknown): v is { storages: Array<unknown> } {
  return v !== null && typeof v === 'object' && 'storages' in v;
}

function hasAnyValue(values: object): boolean {
  const vals: Array<unknown> = Object.values(values);
  return vals.some((v) => {
    if (typeof v === 'string') return v.trim() !== '';
    if (Array.isArray(v)) return v.length > 0;
    if (isFileValue(v)) return v.storages.length > 0;
    return false;
  });
}

// ─── hook: useRowAutoSave ────────────────────────────────────────────────────

interface UseRowAutoSaveOptions {
  tableSlug: string;
  fields: Array<IField>;
  // Undefined = modo create (primeiro save faz POST).
  // String = modo edit (todos os saves fazem PUT).
  rowId?: string;
  // Callback disparado uma vez após o primeiro POST (create mode).
  // Útil para navegação pós-criação em tabelas com FIELD_GROUP.
  onFirstSave?: (rowId: string) => void;
}

interface UseRowAutoSaveReturn {
  savedRowId: React.MutableRefObject<string | null>;
  isSaving: boolean;
  lastSavedAt: Date | null;
  save: (values: CreateRowDefaultValue) => Promise<void>;
}

export function useRowAutoSave({
  tableSlug,
  fields,
  rowId,
  onFirstSave,
}: UseRowAutoSaveOptions): UseRowAutoSaveReturn {
  const savedRowId = React.useRef<string | null>(rowId ?? null);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  const onFirstSaveRef = React.useRef(onFirstSave);
  onFirstSaveRef.current = onFirstSave;

  const _create = useCreateTableRow({
    onSuccess(data) {
      const isFirst = savedRowId.current === null;
      savedRowId.current = data._id;
      setLastSavedAt(new Date());
      if (isFirst) {
        onFirstSaveRef.current?.(data._id);
      }
    },
    onError() {
      toastError(
        'Erro ao salvar',
        'Não foi possível salvar o registro automaticamente',
      );
    },
  });

  const _update = useUpdateTableRow({
    onSuccess() {
      setLastSavedAt(new Date());
    },
    onError() {
      toastError(
        'Erro ao salvar',
        'Não foi possível salvar o registro automaticamente',
      );
    },
  });

  const createRef = React.useRef(_create);
  createRef.current = _create;
  const updateRef = React.useRef(_update);
  updateRef.current = _update;

  const save = React.useCallback(
    async (values: CreateRowDefaultValue): Promise<void> => {
      if (
        createRef.current.status === 'pending' ||
        updateRef.current.status === 'pending'
      ) {
        return;
      }
      const data = buildRowPayload(values, fields);
      if (savedRowId.current === null) {
        await createRef.current.mutateAsync({ slug: tableSlug, data });
      } else {
        await updateRef.current.mutateAsync({
          slug: tableSlug,
          rowId: savedRowId.current,
          data,
        });
      }
    },
    [tableSlug, fields],
  );

  const isSaving = _create.isPending || _update.isPending;

  return { savedRowId, isSaving, lastSavedAt, save };
}

// ─── hook: useAutoSaveController ─────────────────────────────────────────────
// Observa form.store e dispara save com debounce 500ms.
// enabled=false cancela timers pendentes e reseta o ciclo (útil ao alternar modos).

interface UseAutoSaveControllerOptions {
  form: AnyFormApi;
  save: (values: CreateRowDefaultValue) => Promise<void>;
  isUploading: boolean;
  enabled?: boolean;
}

export function useAutoSaveController({
  form,
  save,
  isUploading,
  enabled = true,
}: UseAutoSaveControllerOptions): void {
  const values = useStore(form.store, (s) => s.values);
  const isFirst = React.useRef(true);

  React.useEffect(() => {
    if (!enabled) {
      isFirst.current = true;
      return;
    }
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (isUploading) return;
    if (!hasAnyValue(values)) return;

    const timer = setTimeout(() => {
      void save(values);
    }, 500);

    return (): void => clearTimeout(timer);
  }, [values, isUploading, save, enabled]);
}

// ─── component: SaveStatusIndicator ─────────────────────────────────────────

interface SaveStatusIndicatorProps {
  isSaving: boolean;
  lastSavedAt: Date | null;
}

export function SaveStatusIndicator({
  isSaving,
  lastSavedAt,
}: SaveStatusIndicatorProps): React.JSX.Element {
  const [showSaved, setShowSaved] = React.useState(false);

  React.useEffect(() => {
    if (!lastSavedAt) return;
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 2000);
    return (): void => clearTimeout(t);
  }, [lastSavedAt]);

  return (
    <span className="text-xs">
      {isSaving && (
        <span className="text-muted-foreground animate-pulse">Salvando...</span>
      )}
      {!isSaving && showSaved && (
        <span className="text-green-600">Salvo ✓</span>
      )}
    </span>
  );
}
