import {
  createLazyFileRoute,
  useParams,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import React from 'react';

import { FieldManagementList, TrashedFieldsList } from './-field-order-form';

import { AccessDenied } from '@/components/common/access-denied';
import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { E_TABLE_TYPE } from '@/lib/constant';

export const Route = createLazyFileRoute(
  '/_private/tables/$slug/field/management',
)({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({
    from: '/_private/tables/$slug/field/management',
  });
  const { group: groupSlug } = useSearch({
    from: '/_private/tables/$slug/field/management',
  });
  const sidebar = useSidebar();
  const router = useRouter();
  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

  // Se foi fornecido um group slug, é contexto de grupo
  const isGroupContext = !!groupSlug;
  const targetGroup = isGroupContext
    ? (table.data?.groups ?? []).find((g) => g.slug === groupSlug)
    : null;

  // Loading enquanto verifica permissão
  if (table.status === 'pending' || permission.isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Mostrar erro se não tem permissão
  if (!permission.can('UPDATE_FIELD')) {
    return <AccessDenied />;
  }

  const title =
    isGroupContext || table.data?.type === E_TABLE_TYPE.FIELD_GROUP
      ? 'Gerenciar campos do grupo'
      : 'Gerenciar campos';

  // Se for contexto de grupo, usa campos do grupo; senão, campos da tabela
  const fields =
    isGroupContext && targetGroup
      ? targetGroup.fields
      : (table.data?.fields ?? []);

  const nonNativeFields = fields.filter((f) => !f.native);
  const trashedCount = nonNativeFields.filter((f) => f.trashed).length;

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
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleBack}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">{title}</h1>
        </div>
      </div>

      {/* Content */}
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
              <FieldManagementList
                table={table.data}
                visibilityKey="showInList"
                groupSlug={groupSlug}
                groupFields={
                  isGroupContext && targetGroup ? targetGroup.fields : undefined
                }
              />
            </TabsContent>

            <TabsContent value="filter">
              <FieldManagementList
                table={table.data}
                visibilityKey="showInFilter"
                groupSlug={groupSlug}
                groupFields={
                  isGroupContext && targetGroup ? targetGroup.fields : undefined
                }
                excludeNative
              />
            </TabsContent>

            <TabsContent value="form">
              <FieldManagementList
                table={table.data}
                visibilityKey="showInForm"
                groupSlug={groupSlug}
                groupFields={
                  isGroupContext && targetGroup ? targetGroup.fields : undefined
                }
                excludeNative
              />
            </TabsContent>

            <TabsContent value="detail">
              <FieldManagementList
                table={table.data}
                visibilityKey="showInDetail"
                groupSlug={groupSlug}
                groupFields={
                  isGroupContext && targetGroup ? targetGroup.fields : undefined
                }
              />
            </TabsContent>

            <TabsContent value="trashed">
              <TrashedFieldsList
                table={table.data}
                groupSlug={groupSlug}
                groupFields={
                  isGroupContext && targetGroup
                    ? targetGroup.fields.filter((f) => !f.native)
                    : undefined
                }
                excludeNative
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
