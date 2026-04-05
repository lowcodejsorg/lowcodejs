import { FileText, Pencil, Table, Users } from 'lucide-react';

import { mockRecentActivity } from './-mock-data';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const iconMap: Record<string, typeof Table> = {
  table_created: Table,
  table_updated: Pencil,
  user_created: Users,
  record_created: FileText,
};

export function RecentActivity(): React.JSX.Element {
  return (
    <Card data-test-id="recent-activity">
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {mockRecentActivity.map((activity) => {
          const Icon = iconMap[activity.type] ?? Table;
          return (
            <div
              key={activity.id}
              className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 -mx-2 px-2 rounded-md transition-colors hover:bg-muted/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {activity.description}
                </p>
              </div>
              <p className="text-xs text-muted-foreground shrink-0">
                {activity.time}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
