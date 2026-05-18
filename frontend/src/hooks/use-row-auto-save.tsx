import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  FileTextIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import React from 'react';

import { queryKeys } from './tanstack-query/_query-keys';

import { API } from '@/lib/api';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow } from '@/lib/interfaces';
import { buildRowPayload } from '@/lib/table';
import type { CreateRowDefaultValue } from '@/lib/table';
import { toastError } from '@/lib/toast';

// ─── helpers ────────────────────────────────────────────────────────────────

function isFileValue(v: unknown): v is { storages: Array<unknown> } {
  return v !== null && typeof v === 'object' && 'storages' in v;
}

export function areRequiredFieldsFilled(
  fields: Array<IField>,
  values: CreateRowDefaultValue,
): boolean {
  return fields
    .filter((f) => f.required)
    .every((f) => {
      const v: unknown = values[f.slug];
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
  // Estado inicial de lixeira (relevante só no modo edit).
  initialIsTrashed?: boolean;
  // Callback disparado uma vez após o primeiro POST (create mode).
  onFirstSave?: (rowId: string) => void;
}

interface UseRowAutoSaveReturn {
  isSaving: boolean;
  isError: boolean;
  lastSavedAt: Date | null;
  isDraft: boolean;
  // Salva imediatamente, cancela qualquer debounce pendente.
  triggerSaveImmediate: (values: CreateRowDefaultValue) => Promise<void>;
  // Agenda save com 600ms de debounce (para campos de seleção).
  triggerSaveDebounced: (values: CreateRowDefaultValue) => void;
  // Cancela debounce pendente sem executar.
  cancelDebounce: () => void;
  // Alias de triggerSaveImmediate para compatibilidade.
  triggerSave: (values: CreateRowDefaultValue) => Promise<void>;
}

type CreateMutationPayload = {
  data: Record<string, unknown>;
};

type UpdateMutationPayload = {
  rowId: string;
  data: Record<string, unknown>;
};

type RestoreMutationPayload = {
  rowId: string;
};

const DEBOUNCE_MS = 600;

export function useRowAutoSave({
  tableSlug,
  fields,
  rowId,
  initialIsTrashed = false,
  onFirstSave,
}: UseRowAutoSaveOptions): UseRowAutoSaveReturn {
  const queryClient = useQueryClient();
  const savedRowId = React.useRef<string | null>(rowId ?? null);
  const onFirstSaveRef = React.useRef(onFirstSave);
  onFirstSaveRef.current = onFirstSave;
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [isTrashed, setIsTrashed] = React.useState(initialIsTrashed);

  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pendingValuesRef = React.useRef<CreateRowDefaultValue | null>(null);

  const _create = useMutation({
    mutationFn: async (payload: CreateMutationPayload): Promise<IRow> => {
      const route = `/tables/${tableSlug}/rows`;
      const response = await API.post<IRow>(route, payload.data);
      return response.data;
    },
    onSuccess(data: IRow): void {
      queryClient.setQueryData(
        queryKeys.rows.detail(tableSlug, data._id),
        data,
      );
      if (savedRowId.current === null) {
        onFirstSaveRef.current?.(data._id);
      }
      savedRowId.current = data._id;
      setIsTrashed(data.trashed);
      setLastSavedAt(new Date());
      setIsError(false);
    },
    onError(): void {
      setIsError(true);
      toastError(
        'Erro ao salvar',
        'Não foi possível salvar o registro automaticamente',
      );
    },
  });

  const _update = useMutation({
    mutationFn: async (payload: UpdateMutationPayload): Promise<IRow> => {
      const route = `/tables/${tableSlug}/rows/${payload.rowId}`;
      const response = await API.put<IRow>(route, payload.data);
      return response.data;
    },
    onSuccess(data: IRow): void {
      queryClient.setQueryData(
        queryKeys.rows.detail(tableSlug, data._id),
        data,
      );
      setLastSavedAt(new Date());
      setIsError(false);
    },
    onError(): void {
      setIsError(true);
      toastError(
        'Erro ao salvar',
        'Não foi possível salvar o registro automaticamente',
      );
    },
  });

  const _restore = useMutation({
    mutationFn: async (payload: RestoreMutationPayload): Promise<IRow> => {
      const route = `/tables/${tableSlug}/rows/${payload.rowId}/restore`;
      const response = await API.patch<IRow>(route);
      return response.data;
    },
    onSuccess(data: IRow): void {
      queryClient.setQueryData(
        queryKeys.rows.detail(tableSlug, data._id),
        data,
      );
      setIsTrashed(false);
    },
    onError(): void {
      console.warn('[useRowAutoSave] falha ao restaurar da lixeira');
    },
  });

  // Lógica central de save — chamada por immediate e pelo timer do debounce.
  const executeSave = React.useCallback(
    async (values: CreateRowDefaultValue): Promise<void> => {
      if (_create.isPending || _update.isPending || _restore.isPending) {
        return;
      }

      const requiredFilled = areRequiredFieldsFilled(fields, values);
      const rawData = buildRowPayload(values, fields);
      const data: Record<string, unknown> = rawData;

      if (savedRowId.current === null) {
        const draftPayload: Record<string, unknown> = { ...data };
        if (!requiredFilled) {
          for (const field of fields) {
            if (draftPayload[field.slug] === null) {
              if (
                field.type === E_FIELD_TYPE.TEXT_SHORT ||
                field.type === E_FIELD_TYPE.TEXT_LONG
              ) {
                draftPayload[field.slug] = 'rascunho';
              }
              if (field.type === E_FIELD_TYPE.DATE) {
                draftPayload[field.slug] = new Date().toISOString();
              }
            }
          }
        }
        await _create.mutateAsync({
          data: { ...draftPayload, trashed: !requiredFilled },
        });
        return;
      }

      const currentRowId = savedRowId.current;
      await _update.mutateAsync({ rowId: currentRowId, data });

      if (isTrashed && requiredFilled) {
        await _restore.mutateAsync({ rowId: currentRowId });
      }
    },
    [fields, isTrashed, _create, _update, _restore],
  );

  const cancelDebounce = React.useCallback((): void => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const triggerSaveImmediate = React.useCallback(
    async (values: CreateRowDefaultValue): Promise<void> => {
      cancelDebounce();
      await executeSave(values);
    },
    [cancelDebounce, executeSave],
  );

  const triggerSaveDebounced = React.useCallback(
    (values: CreateRowDefaultValue): void => {
      pendingValuesRef.current = values;
      cancelDebounce();
      debounceTimerRef.current = setTimeout((): void => {
        debounceTimerRef.current = null;
        if (pendingValuesRef.current !== null) {
          void executeSave(pendingValuesRef.current);
        }
      }, DEBOUNCE_MS);
    },
    [cancelDebounce, executeSave],
  );

  // Cleanup do timer ao desmontar.
  React.useEffect(() => {
    return (): void => {
      cancelDebounce();
    };
  }, [cancelDebounce]);

  const isSaving = _create.isPending || _update.isPending || _restore.isPending;

  return {
    isSaving,
    isError,
    lastSavedAt,
    isDraft: isTrashed,
    triggerSaveImmediate,
    triggerSaveDebounced,
    cancelDebounce,
    triggerSave: triggerSaveImmediate,
  };
}

// ─── component: SaveStatusIndicator ─────────────────────────────────────────

interface SaveStatusIndicatorProps {
  isSaving: boolean;
  isError: boolean;
  lastSavedAt: Date | null;
  isDraft?: boolean;
}

export function SaveStatusIndicator({
  isSaving,
  isError,
  lastSavedAt,
  isDraft = false,
}: SaveStatusIndicatorProps): React.JSX.Element {
  const [showSaved, setShowSaved] = React.useState(false);

  React.useEffect(() => {
    if (!lastSavedAt) return;
    setShowSaved(true);
    const t = setTimeout((): void => setShowSaved(false), 2000);
    return (): void => clearTimeout(t);
  }, [lastSavedAt]);

  return (
    <span className="flex items-center gap-1 text-xs">
      {isSaving && (
        <React.Fragment>
          <LoaderCircleIcon className="size-3 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Salvando...</span>
        </React.Fragment>
      )}
      {!isSaving && showSaved && !isDraft && (
        <React.Fragment>
          <CheckCircleIcon className="size-3 text-green-600" />
          <span className="text-green-600">Salvo</span>
        </React.Fragment>
      )}
      {!isSaving && !showSaved && isDraft && (
        <React.Fragment>
          <FileTextIcon className="size-3 text-yellow-600" />
          <span className="text-yellow-600">Rascunho (lixeira)</span>
        </React.Fragment>
      )}
      {!isSaving && !showSaved && !isDraft && isError && (
        <React.Fragment>
          <AlertCircleIcon className="size-3 text-destructive" />
          <span className="text-destructive">Erro ao salvar</span>
        </React.Fragment>
      )}
    </span>
  );
}
