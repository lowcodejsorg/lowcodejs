import { useState } from 'react';

export function useToolbarPortal(): {
  toolbarRef: (node: HTMLDivElement | null) => void;
  toolbarNode: HTMLDivElement | null;
} {
  const [toolbarNode, setToolbarNode] =
    useState<HTMLDivElement | null>(null);

  return { toolbarRef: setToolbarNode, toolbarNode };
}
