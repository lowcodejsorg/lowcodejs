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
    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockRecentActivity.map((activity) => {
          const Icon = iconMap[activity.type] ?? Table;
          return (
            <div
              key={activity.id}
              className="flex items-center gap-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
