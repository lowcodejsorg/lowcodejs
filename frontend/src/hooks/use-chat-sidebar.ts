import { useCallback, useState } from 'react';

export function useChatSidebar(): {
  open: boolean;
  onOpenChange: (value: boolean) => void;
} {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem('chat-sidebar-open') === 'true';
    } catch {
      return false;
    }
  });

  const onOpenChange = useCallback((value: boolean) => {
    setOpen(value);
    try {
      localStorage.setItem('chat-sidebar-open', String(value));
    } catch {}
  }, []);

  return { open, onOpenChange };
}
