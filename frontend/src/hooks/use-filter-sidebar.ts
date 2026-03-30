import { useCallback, useState } from 'react';

export function useFilterSidebar(): {
  open: boolean;
  onOpenChange: (value: boolean) => void;
} {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem('filter-sidebar-open') === 'true';
    } catch {
      return false;
    }
  });

  const onOpenChange = useCallback((value: boolean) => {
    setOpen(value);
    try {
      localStorage.setItem('filter-sidebar-open', String(value));
    } catch {}
  }, []);

  return { open, onOpenChange };
}
