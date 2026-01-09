import {
  createFileRoute,
  useParams,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import React from 'react';
import z from 'zod';

import { FieldOrderForm, TrashedFieldsList } from './-field-order-form';

import { AccessDenied } from '@/components/common/access-denied';
import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { E_TABLE_TYPE } from '@/lib/constant';

export const Route = createFileRoute('/_private/tables/$slug/field/order')({
  component: RouteComponent,
  validateSearch: z.object({
    from: z.string().optional(),
  }),
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({ from: '/_private/tables/$slug/field/order' });
  const { from } = useSearch({ from: '/_private/tables/$slug/field/order' });
  const sidebar = useSidebar();
  const router = useRouter();
  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

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
    table.data?.type === E_TABLE_TYPE.FIELD_GROUP
      ? 'Gerenciar campos do grupo'
      : 'Gerenciar campos';

  const trashedCount = table.data?.fields.filter((f) => f.trashed).length ?? 0;

  const targetSlug = from ?? slug;

  const handleBack = (): void => {
    sidebar.setOpen(true);
    router.navigate({
      to: '/tables/$slug',
      params: { slug: targetSlug },
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
            defaultValue="orderList"
            className="w-full max-w-6xl mx-auto"
          >
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="orderList">Lista / Grid</TabsTrigger>
              <TabsTrigger value="orderForm">Formulário</TabsTrigger>
              <TabsTrigger
                value="trashed"
                disabled={trashedCount === 0}
              >
                Lixeira{trashedCount > 0 && ` (${trashedCount})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orderList">
              <FieldOrderForm
                table={table.data}
                reference="orderList"
                onSuccess={handleBack}
              />
            </TabsContent>

            <TabsContent value="orderForm">
              <FieldOrderForm
                table={table.data}
                reference="orderForm"
                onSuccess={handleBack}
              />
            </TabsContent>

            <TabsContent value="trashed">
              <TrashedFieldsList table={table.data} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
