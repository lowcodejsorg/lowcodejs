import { createFileRoute } from '@tanstack/react-router';
import { FileText, Table, UserCheck, Users } from 'lucide-react';

import { ChartTables } from './-chart-tables';
import { ChartUsers } from './-chart-users';
import { mockStats } from './-mock-data';
import { RecentActivity } from './-recent-activity';
import { StatCard } from './-stat-card';

export const Route = createFileRoute('/_private/dashboard/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-4 border-b">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Tabelas"
            value={mockStats.totalTables}
            icon={Table}
          />
          <StatCard
            title="Total de Usuários"
            value={mockStats.totalUsers}
            icon={Users}
          />
          <StatCard
            title="Total de Registros"
            value={mockStats.totalRecords}
            icon={FileText}
          />
          <StatCard
            title="Usuários Ativos"
            value={mockStats.activeUsers}
            icon={UserCheck}
            description={`${Math.round((mockStats.activeUsers / mockStats.totalUsers) * 100)}% do total`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartTables />
          <ChartUsers />
        </div>

        <RecentActivity />
      </div>
    </div>
  );
}
