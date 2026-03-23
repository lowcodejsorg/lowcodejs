import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import React from 'react';

import { AccessDenied } from '@/components/common/access-denied';
import { FieldManagement } from '@/components/common/field-management/field-management';
import { LoadError } from '@/components/common/load-error';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useGroupFieldManagement } from '@/hooks/use-group-field-management';
import { useTablePermission } from '@/hooks/use-table-permission';

export const Route = createLazyFileRoute(
  '/_private/tables/$slug/group/$groupSlug/field/management',
)({
  component: GroupFieldManagementPage,
});

function GroupFieldManagementPage(): React.JSX.Element {
  const { slug, groupSlug } = useParams({
    from: '/_private/tables/$slug/group/$groupSlug/field/management',
  });
  const sidebar = useSidebar();
  const router = useRouter();
  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);
  const actions = useGroupFieldManagement(table.data, groupSlug);

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

  const targetGroup = (table.data?.groups ?? []).find(
    (g) => g.slug === groupSlug,
  );
  const groupName = targetGroup?.name ?? groupSlug;

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
        title={`Gerenciar campos - ${groupName}`}
        onBack={handleBack}
      />
      <FieldManagement.Tabs />
    </FieldManagement.Root>
  );
}
