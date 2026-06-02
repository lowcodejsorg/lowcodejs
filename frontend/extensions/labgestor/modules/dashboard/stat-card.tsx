import type { LucideIcon } from 'lucide-react';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: number | null;
  icon: LucideIcon;
  loading?: boolean;
  error?: boolean;
  description?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  error,
  description,
}: StatCardProps): React.JSX.Element {
  return (
    <Card
      data-test-id={`labgestor-stat-card-${title}`}
      className="transition-shadow duration-200 hover:shadow-md"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading && <Skeleton className="h-8 w-20" />}
        {!loading && error && (
          <div className="text-sm text-destructive">Erro ao carregar</div>
        )}
        {!loading && !error && (
          <div className="text-2xl font-bold">
            {value !== null ? value.toLocaleString('pt-BR') : '-'}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
