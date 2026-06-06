import { DownloadIcon, ExternalLinkIcon, LinkIcon } from 'lucide-react';
import React from 'react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { IStorage } from '@/lib/interfaces';
import { getStorageDownloadUrl, getStorageInlineUrl } from '@/lib/storage-url';
import { toastSuccess } from '@/lib/toast';

interface AttachmentContextMenuProps {
  storage: Pick<IStorage, 'url' | 'originalName'>;
  children: React.ReactNode;
}

export function AttachmentContextMenu({
  storage,
  children,
}: AttachmentContextMenuProps): React.JSX.Element {
  const inlineUrl = getStorageInlineUrl(storage);
  const downloadUrl = getStorageDownloadUrl(storage);

  const handleCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(inlineUrl);
    toastSuccess('Link copiado');
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem asChild>
          <a
            href={inlineUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLinkIcon />
            Abrir em nova aba
          </a>
        </ContextMenuItem>
        <ContextMenuItem asChild>
          <a href={downloadUrl}>
            <DownloadIcon />
            Salvar arquivo
          </a>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => void handleCopyLink()}>
          <LinkIcon />
          Copiar link
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
