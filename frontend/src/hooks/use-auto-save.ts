import React from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'draft' | 'error';

type UseAutoSaveOptions = {
  onSave: () => Promise<void>;
  isTrashed: boolean;
  canSave?: () => boolean;
  debounceMs?: number;
  intervalMs?: number;
  isDirty?: () => boolean;
};

type UseAutoSaveReturn = {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  triggerSave: () => void;
  cancelPending: () => void;
};

const DEFAULT_DEBOUNCE_MS = 1000;
const DEFAULT_INTERVAL_MS = 60_000;

export function useAutoSave({
  onSave,
  isTrashed,
  canSave,
  isDirty,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  intervalMs = DEFAULT_INTERVAL_MS,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = React.useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  const isSavingRef = React.useRef(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = React.useRef(onSave);
  const canSaveRef = React.useRef(canSave);
  const isDirtyRef = React.useRef(isDirty);
  const isTrashedRef = React.useRef(isTrashed);

  React.useEffect((): void => {
    onSaveRef.current = onSave;
    canSaveRef.current = canSave;
    isDirtyRef.current = isDirty;
    isTrashedRef.current = isTrashed;
  }, [onSave, canSave, isDirty, isTrashed]);

  const performSave = React.useCallback(async (): Promise<void> => {
    if (isSavingRef.current) return;
    if (canSaveRef.current && !canSaveRef.current()) return;

    isSavingRef.current = true;
    setStatus('saving');

    try {
      await onSaveRef.current();
      const now = new Date();
      setLastSavedAt(now);
      if (isTrashedRef.current) {
        setStatus('draft');
      } else {
        setStatus('saved');
      }
    } catch {
      setStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  const cancelPending = React.useCallback((): void => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const triggerSave = React.useCallback((): void => {
    if (canSaveRef.current && !canSaveRef.current()) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout((): void => {
      debounceRef.current = null;
      void performSave();
    }, debounceMs);
  }, [debounceMs, performSave]);

  React.useEffect((): (() => void) => {
    const interval = setInterval((): void => {
      if (isSavingRef.current) return;
      if (debounceRef.current) return;
      if (isDirtyRef.current && !isDirtyRef.current()) return;
      if (canSaveRef.current && !canSaveRef.current()) return;
      void performSave();
    }, intervalMs);
    return (): void => clearInterval(interval);
  }, [intervalMs, performSave]);

  React.useEffect((): (() => void) => {
    return (): void => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  React.useEffect((): void => {
    if (status === 'saved' && isTrashed) {
      setStatus('draft');
    }
    if (status === 'draft' && !isTrashed) {
      setStatus('saved');
    }
  }, [isTrashed, status]);

  return { status, lastSavedAt, triggerSave, cancelPending };
}
