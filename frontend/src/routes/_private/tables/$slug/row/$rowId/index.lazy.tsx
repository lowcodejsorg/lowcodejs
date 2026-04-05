import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { Share2Icon, ShieldXIcon } from 'lucide-react';
import React from 'react';

import { UpdateRowFormSkeleton } from './-update-form-skeleton';
import { UpdateRowForm } from './-update-row-form';

import { LoginButton } from '@/components/common/layout/login-button';
import { PageHeader, PageShell } from '@/components/common/page-shell';
import { LoadError } from '@/components/common/route-status/load-error';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useSidebar } from '@/components/ui/sidebar';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useReadTableRow } from '@/hooks/tanstack-query/use-table-row-read';
import { toastInfo } from '@/lib/toast';
import { useAuthStore } from '@/stores/authentication';

export const Route = createLazyFileRoute('/_private/tables/$slug/row/$rowId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = Boolean(user);

  const sidebar = useSidebar();
  const router = useRouter();

  const { slug, rowId } = useParams({
    from: '/_private/tables/$slug/row/$rowId/',
  });

  const table = useReadTable({ slug });
  const row = useReadTableRow({ slug, rowId });

  // Loading
  if (table.status === 'pending' || row.status === 'pending') {
    return <UpdateRowFormSkeleton />;
  }

  // Error
  if (table.status === 'error' || row.status === 'error') {
    const error = (table.error ?? row.error) as AxiosError<{
      code: number;
      cause: string;
    }>;
    const cause = error?.response?.data?.cause;

    if (
      cause === 'TABLE_PRIVATE' ||
      cause === 'FORM_VIEW_RESTRICTED' ||
      error?.response?.status === 403 ||
      error?.response?.status === 401
    ) {
      const message =
        cause === 'TABLE_PRIVATE'
          ? 'Esta tabela é privada'
          : cause === 'FORM_VIEW_RESTRICTED'
            ? 'Apenas o dono pode visualizar tabelas de formulário'
            : 'Você não tem permissão para acessar este registro';

      return (
        <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldXIcon />
            </EmptyMedia>
            <EmptyTitle>Acesso negado</EmptyTitle>
            <EmptyDescription>{message}</EmptyDescription>
            {!isAuthenticated && (
              <div className="mt-4">
                <LoginButton />
              </div>
            )}
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <LoadError
        message="Houve um erro ao buscar dados do registro"
        refetch={() => {
          table.refetch();
          row.refetch();
        }}
      />
    );
  }

  const goBack = (): void => {
    sidebar.setOpen(false);
    router.navigate({
      to: '/tables/$slug',
      replace: true,
      params: { slug },
    });
  };

  // Success
  return (
    <PageShell data-test-id="row-detail-page">
      {/* Header */}
      <PageShell.Header borderBottom={false}>
        <PageHeader
          onBack={isAuthenticated ? goBack : undefined}
          title="Detalhes do registro"
        >
          <Button
            variant="outline"
            className="shadow-none p-1 h-auto"
            data-test-id="row-share-btn"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toastInfo(
                'Link do registro copiado',
                'O link do registro foi copiado para a área de transferência',
              );
            }}
          >
            <Share2Icon />
            <span className="sr-only">Compartilhar</span>
          </Button>
        </PageHeader>
      </PageShell.Header>

      <UpdateRowForm
        table={table.data}
        data={row.data}
      />
    </PageShell>
  );
}
