import { LinkIcon } from 'lucide-react';
import React from 'react';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { IRow, ITable } from '@/lib/interfaces';
import { toast } from 'sonner';

interface Props {
  /** Tabela em foco. Recebida via context do `<ExtensionSlot id="table.row.actions">`. */
  table?: ITable;
  /** Registro da linha onde o dropdown foi aberto. */
  row: IRow;
  /** Slug da tabela atual. */
  slug: string;
}

export default function CopyRecordLinkPlugin({
  row,
  slug,
}: Props): React.JSX.Element {
  async function handleCopy(): Promise<void> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/tables/${slug}/row/${row._id}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado', {
        description: 'O link do registro está na área de transferência.',
      });
    } catch {
      toast.error('Não foi possível copiar', {
        description: 'Copie manualmente o link da barra de endereços.',
      });
    }
  }

  return (
    <DropdownMenuItem
      className="inline-flex space-x-1 w-full cursor-pointer"
      onSelect={(event) => {
        event.preventDefault();
        void handleCopy();
      }}
      data-test-id="plugin-copy-record-link"
    >
      <LinkIcon className="size-4" />
      <span>Copiar link</span>
    </DropdownMenuItem>
  );
}
