import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import React from 'react';

import { AccessDenied } from '@/components/common/access-denied';
import { LoadError } from '@/components/common/load-error';
import { FieldManagement } from '@/components/field-management/field-management';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTableFieldManagement } from '@/hooks/use-table-field-management';
import { useTablePermission } from '@/hooks/use-table-permission';

export const Route = createLazyFileRoute(
  '/_private/tables/$slug/field/management',
)({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({
    from: '/_private/tables/$slug/field/management',
  });
  const sidebar = useSidebar();
  const router = useRouter();
  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);
  const actions = useTableFieldManagement(table.data);

  if (table.status === 'pending' || permission.isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!permission.can('UPDATE_FIELD')) {
    return <AccessDenied />;
  }

  if (table.status === 'error') {
    return (
      <LoadError
        message="Erro ao buscar dados da tabela"
        refetch={table.refetch}
      />
    );
  }

  const handleBack = (): void => {
    sidebar.setOpen(true);
    router.navigate({
      to: '/tables/$slug',
      params: { slug },
      replace: true,
    });
  };

  return (
    <FieldManagement.Root actions={actions}>
      <FieldManagement.Header
        title="Gerenciar campos"
        onBack={handleBack}
      />
      <FieldManagement.Tabs />
    </FieldManagement.Root>
  );
}
