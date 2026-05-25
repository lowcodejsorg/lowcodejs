import React from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'draft' | 'error';

type UseAutoSaveOptions = {
  onSave: () => Promise<void>;
  isTrashed: boolean;
};

type UseAutoSaveReturn = {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  triggerSave: () => void;
};

export function useAutoSave({
  onSave,
  isTrashed,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = React.useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  const isSavingRef = React.useRef(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSave = React.useCallback(async (): Promise<void> => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setStatus('saving');

    try {
      await onSave();
      const now = new Date();
      setLastSavedAt(now);
      if (isTrashed) {
        setStatus('draft');
      } else {
        setStatus('saved');
      }
    } catch {
      setStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, isTrashed]);

  // Debounce de 500ms para coalescer tabs rápidos entre campos
  const triggerSave = React.useCallback((): void => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout((): void => {
      void performSave();
    }, 500);
  }, [performSave]);

  // Sincroniza status quando isTrashed muda após save do backend
  React.useEffect((): void => {
    if (status === 'saved' && isTrashed) {
      setStatus('draft');
    }
    if (status === 'draft' && !isTrashed) {
      setStatus('saved');
    }
  }, [isTrashed, status]);

  return { status, lastSavedAt, triggerSave };
}
