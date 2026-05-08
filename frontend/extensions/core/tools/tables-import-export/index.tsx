import { ArrowDownUpIcon } from 'lucide-react';
import React from 'react';

import { ExportTableSection } from './export-section';
import { ImportTableSection } from './import-section';

import { PageHeader, PageShell } from '@/components/common/page-shell';

export default function TablesImportExportTool(): React.JSX.Element {
  return (
    <PageShell data-test-id="tool-tables-import-export">
      <PageShell.Header>
        <PageHeader title="Importar / Exportar Tabela">
          <ArrowDownUpIcon className="size-5 text-muted-foreground" />
        </PageHeader>
      </PageShell.Header>

      <PageShell.Content className="p-4">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 max-w-6xl">
          <ExportTableSection />
          <ImportTableSection />
        </div>
      </PageShell.Content>
    </PageShell>
  );
}
