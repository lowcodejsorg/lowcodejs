import { PanelRightCloseIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface ForumHeaderProps {
  title: string;
  description: string;
  composerLayout: 'side' | 'bottom';
  onChangeLayout: (layout: 'side' | 'bottom') => void;
}

export function ForumHeader({
  title,
  description,
  composerLayout,
  onChangeLayout,
}: ForumHeaderProps): React.JSX.Element {
  return (
    <div className="shrink-0 border-b p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Área de texto</span>
          <div className="flex items-center rounded-md border bg-background p-1">
            <Button
              type="button"
              size="icon-sm"
              variant={composerLayout === 'bottom' ? 'secondary' : 'ghost'}
              onClick={() => onChangeLayout('bottom')}
              className="cursor-pointer"
              aria-label="Compositor embaixo"
              title="Compositor embaixo"
            >
              <PanelRightCloseIcon className="size-4 rotate-90" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant={composerLayout === 'side' ? 'secondary' : 'ghost'}
              onClick={() => onChangeLayout('side')}
              className="cursor-pointer"
              aria-label="Compositor ao lado"
              title="Compositor ao lado"
            >
              <PanelRightCloseIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
