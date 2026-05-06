import { useSuspenseQuery } from '@tanstack/react-query';
import { createLazyFileRoute, Link } from '@tanstack/react-router';
import * as LucideIcons from 'lucide-react';
import { WrenchIcon, type LucideIcon } from 'lucide-react';
import React from 'react';

import { PageHeader, PageShell } from '@/components/common/page-shell';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import { extensionActiveListOptions } from '@/hooks/tanstack-query/use-extensions-active-list';
import { E_EXTENSION_TYPE } from '@/lib/constant';

export const Route = createLazyFileRoute('/_private/tools/')({
  component: RouteComponent,
});

function resolveLucideIcon(name: string | null | undefined): LucideIcon {
  if (!name) return WrenchIcon;
  const candidate = (LucideIcons as Record<string, unknown>)[name];
  if (typeof candidate === 'function' || typeof candidate === 'object') {
    return candidate as LucideIcon;
  }
  return WrenchIcon;
}

function RouteComponent(): React.JSX.Element {
  const { data } = useSuspenseQuery(extensionActiveListOptions());

  const tools = React.useMemo(
    () => data.filter((e) => e.type === E_EXTENSION_TYPE.TOOL),
    [data],
  );

  return (
    <PageShell data-test-id="tools-page">
      <PageShell.Header>
        <PageHeader title="Ferramentas" />
      </PageShell.Header>

      <PageShell.Content className="p-4">
        {tools.length === 0 && (
          <Empty>
            <EmptyTitle>Nenhuma ferramenta ativa</EmptyTitle>
            <EmptyDescription>
              Ative ferramentas em <Link to="/extensions">Extensões</Link> para
              que apareçam aqui.
            </EmptyDescription>
          </Empty>
        )}

        {tools.length > 0 && (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => {
              const Icon = resolveLucideIcon(tool.icon);
              return (
                <Link
                  key={tool._id}
                  to="/tools/$package/$id"
                  params={{ package: tool.pkg, id: tool.extensionId }}
                  className="block"
                  data-test-id={`tool-card-${tool.extensionId}`}
                >
                  <Card className="hover:bg-accent/50 transition-colors h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="size-5 text-primary" />
                        <span>{tool.name}</span>
                      </CardTitle>
                      <CardDescription>
                        {tool.description ?? 'Sem descrição'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground font-mono">
                      {tool.pkg}/{tool.extensionId}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </PageShell.Content>
    </PageShell>
  );
}
