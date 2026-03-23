import { MessageCircleIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface ChatTriggerProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ChatTrigger({
  onClick,
  isOpen,
}: ChatTriggerProps): React.JSX.Element {
  return (
    <Button
      variant={isOpen ? 'default' : 'outline'}
      className="shadow-none p-1 h-auto"
      onClick={onClick}
    >
      <MessageCircleIcon className="size-4" />
      <span>Assistente</span>
    </Button>
  );
}
