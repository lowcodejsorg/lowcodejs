import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import React from 'react';

import {
  GroupFieldManagementList,
  GroupTrashedFieldsList,
} from '../../../field/-group-field-management';

import { AccessDenied } from '@/components/common/access-denied';
import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
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

  const targetGroup = (table.data?.groups ?? []).find(
    (g) => g.slug === groupSlug,
  );
  const groupName = targetGroup?.name ?? groupSlug;
  const groupFields = targetGroup?.fields ?? [];
  const trashedCount = groupFields.filter((f) => !f.native && f.trashed).length;

  const handleBack = (): void => {
    sidebar.setOpen(true);
    router.navigate({
      to: '/tables/$slug',
      params: { slug },
      replace: true,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleBack}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">
            Gerenciar campos - {groupName}
          </h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative p-4">
        {table.status === 'error' && (
          <LoadError
            message="Erro ao buscar dados da tabela"
            refetch={table.refetch}
          />
        )}

        {table.status === 'success' && (
          <Tabs
            defaultValue="display"
            className="w-full max-w-6xl mx-auto"
          >
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="display">Lista</TabsTrigger>
              <TabsTrigger value="filter">Filtros</TabsTrigger>
              <TabsTrigger value="form">Formulários</TabsTrigger>
              <TabsTrigger value="detail">Detalhes</TabsTrigger>
              <TabsTrigger
                value="trashed"
                disabled={trashedCount === 0}
              >
                Lixeira{trashedCount > 0 && ` (${trashedCount})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="display">
              <GroupFieldManagementList
                table={table.data}
                groupSlug={groupSlug}
                visibilityKey="showInList"
              />
            </TabsContent>

            <TabsContent value="filter">
              <GroupFieldManagementList
                table={table.data}
                groupSlug={groupSlug}
                visibilityKey="showInFilter"
                excludeNative
              />
            </TabsContent>

            <TabsContent value="form">
              <GroupFieldManagementList
                table={table.data}
                groupSlug={groupSlug}
                visibilityKey="showInForm"
                excludeNative
              />
            </TabsContent>

            <TabsContent value="detail">
              <GroupFieldManagementList
                table={table.data}
                groupSlug={groupSlug}
                visibilityKey="showInDetail"
              />
            </TabsContent>

            <TabsContent value="trashed">
              <GroupTrashedFieldsList
                table={table.data}
                groupSlug={groupSlug}
                excludeNative
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
