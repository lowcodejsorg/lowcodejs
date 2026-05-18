import { Settings2Icon, ScanTextIcon } from 'lucide-react';
import React, { Suspense } from 'react';

import { PageHeader, PageShell } from '@/components/common/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ConfigTab } from './-config-tab';
import { TranscriptionTab } from './-transcription-tab';

function TabSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function DocTranscriptionTool(): React.JSX.Element {
  return (
    <PageShell data-test-id="tool-doc-transcription">
      <PageShell.Header>
        <PageHeader title="Transcrição de Documentos" />
      </PageShell.Header>

      <PageShell.Content className="p-4">
        <Tabs defaultValue="transcricao">
          <TabsList className="mb-4">
            <TabsTrigger
              value="transcricao"
              className="gap-2"
            >
              <ScanTextIcon className="size-4" />
              Transcrever
            </TabsTrigger>
            <TabsTrigger
              value="configuracoes"
              className="gap-2"
            >
              <Settings2Icon className="size-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcricao">
            <Suspense fallback={<TabSkeleton />}>
              <TranscriptionTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="configuracoes">
            <Suspense fallback={<TabSkeleton />}>
              <ConfigTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </PageShell.Content>
    </PageShell>
  );
}
