import { FolderKanbanIcon, PackageIcon, WrenchIcon } from 'lucide-react';
import React from 'react';

import { StatCard } from './stat-card';

import { PageHeader, PageShell } from '@/components/common/page-shell';
import { useReadTableRowPaginated } from '@/hooks/tanstack-query/use-table-row-read-paginated';

const COUNT_SEARCH = { page: 1, perPage: 1 };

interface CardEntry {
  slug: string;
  title: string;
  icon: typeof FolderKanbanIcon;
}

const CARDS: ReadonlyArray<CardEntry> = [
  { slug: 'projeto', title: 'Projetos', icon: FolderKanbanIcon },
  { slug: 'produtos', title: 'Produtos', icon: PackageIcon },
  { slug: 'equipamento', title: 'Equipamentos', icon: WrenchIcon },
];

export default function LabgestorDashboardModule(): React.JSX.Element {
  return (
    <PageShell data-test-id="module-labgestor-dashboard">
      <PageShell.Header>
        <PageHeader title="Dashboard Labgestor" />
      </PageShell.Header>

      <PageShell.Content className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CARDS.map((card) => (
            <CountCard
              key={card.slug}
              slug={card.slug}
              title={card.title}
              icon={card.icon}
            />
          ))}
        </div>
      </PageShell.Content>
    </PageShell>
  );
}

function CountCard({
  slug,
  title,
  icon,
}: CardEntry): React.JSX.Element {
  const query = useReadTableRowPaginated({ slug, search: COUNT_SEARCH });

  return (
    <StatCard
      title={title}
      value={query.data?.meta.total ?? null}
      icon={icon}
      loading={query.isPending}
      error={query.isError}
      description={`Total cadastrado em ${title.toLowerCase()}.`}
    />
  );
}
