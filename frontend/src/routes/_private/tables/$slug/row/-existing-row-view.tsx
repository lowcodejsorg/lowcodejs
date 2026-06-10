import { useNavigate } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { Share2Icon, ShieldXIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { AutoSaveRowForm } from './-auto-save-row-form';
import { RowDetailSkeleton } from './-row-detail-skeleton';
import { RowDetailView } from './-row-detail-view';
import { resolveExistingMode } from './-row-mode';

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
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useReadTableRow } from '@/hooks/tanstack-query/use-table-row-read';
import { useAuthStore } from '@/stores/authentication';

interface ApiErrorData {
  cause?: string;
  code?: number;
}

function isApiErrorData(value: unknown): value is ApiErrorData {
  return typeof value === 'object' && value !== null;
}

interface ExistingRowViewProps {
  slug: string;
  rowId: string;
  mode: 'view' | 'edit' | undefined;
  onBack: () => void;
}

export function ExistingRowView({
  slug,
  rowId,
  mode,
  onBack,
}: ExistingRowViewProps): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = Boolean(user);
  const navigate = useNavigate();

  const table = useReadTable({ slug });
  const row = useReadTableRow({ slug, rowId });

  const isLoadingTable = !table.data && table.status === 'pending';
  const isLoadingRow = !row.data && row.status === 'pending';
  const isLoading = isLoadingTable || isLoadingRow;

  const backGuardRef = React.useRef<(() => void) | null>(null);

  const goToView = (): void => {
    void navigate({
      to: '/tables/$slug/row/',
      params: { slug },
      // mode explícito: sair da edição vai para visualização mesmo se o
      // registro ainda for rascunho (sem isso o default reabriria em edição).
      search: { _id: rowId, mode: 'view' as const },
      replace: true,
    });
  };

  const handleEditBack = (): void => {
    const guard = backGuardRef.current;
    if (guard) {
      guard();
      return;
    }
    goToView();
  };

  const goToEdit = (): void => {
    void navigate({
      to: '/tables/$slug/row/',
      params: { slug },
      search: { _id: rowId, mode: 'edit' as const },
    });
  };

  const handleShare = (): void => {
    const origin = window.location.origin;

    // Com slug amigavel (sharedRowSlug gerado quando rowSlugFieldId esta
    // configurado), copia a URL limpa /tables/<slug>/<sharedRowSlug>; senao
    // cai no fallback por _id.
    let url = `${origin}/tables/${slug}/row?_id=${rowId}&mode=view`;
    if (row.data?.sharedRowSlug) {
      url = `${origin}/tables/${slug}/${row.data.sharedRowSlug}`;
    }

    navigator.clipboard.writeText(url);
    toast.info('Link do registro copiado', {
      description:
        'O link do registro foi copiado para a área de transferência',
    });
  };

  if (isLoading) {
    return <RowDetailSkeleton />;
  }

  if (table.status === 'error' || row.status === 'error') {
    const rawError = table.error ?? row.error;

    let cause: string | undefined;
    let httpStatus: number | undefined;

    if (isAxiosError(rawError)) {
      const errorData: unknown = rawError.response?.data;
      if (isApiErrorData(errorData)) {
        cause = errorData.cause;
      }
      httpStatus = rawError.response?.status;
    }

    const isAccessDenied =
      cause === 'TABLE_PRIVATE' ||
      cause === 'FORM_VIEW_RESTRICTED' ||
      httpStatus === 403 ||
      httpStatus === 401;

    if (isAccessDenied) {
      let message = 'Você não tem permissão para acessar este registro';
      if (cause === 'TABLE_PRIVATE') {
        message = 'Esta tabela é privada';
      }
      if (cause === 'FORM_VIEW_RESTRICTED') {
        message = 'Apenas o dono pode visualizar tabelas de formulário';
      }

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
        refetch={(): void => {
          table.refetch();
          row.refetch();
        }}
      />
    );
  }

  let backHandler: (() => void) | undefined;
  if (isAuthenticated) {
    backHandler = onBack;
  }

  let effectiveMode: 'view' | 'edit' = mode ?? 'view';
  if (row.data) {
    effectiveMode = resolveExistingMode(mode, row.data, user?._id);
  }

  return (
    <PageShell data-test-id="row-detail-page">
      {effectiveMode === 'view' && (
        <PageShell.Header borderBottom={false}>
          <PageHeader
            onBack={backHandler}
            title="Detalhes do registro"
          >
            <Button
              variant="outline"
              className="shadow-none p-1 h-auto"
              data-test-id="row-share-btn"
              onClick={handleShare}
            >
              <Share2Icon />
              <span className="sr-only">Compartilhar</span>
            </Button>
          </PageHeader>
        </PageShell.Header>
      )}

      {effectiveMode === 'edit' && (
        <PageShell.Header borderBottom={false}>
          <PageHeader
            onBack={handleEditBack}
            title="Editar registro"
          />
        </PageShell.Header>
      )}

      {effectiveMode === 'view' &&
        table.status === 'success' &&
        row.status === 'success' && (
          <RowDetailView
            table={table.data}
            data={row.data}
            onBack={onBack}
            onEdit={goToEdit}
          />
        )}

      {effectiveMode === 'edit' &&
        table.status === 'success' &&
        row.status === 'success' && (
          // key por _id: garante que o form remonte com os defaultValues do
          // registro (TanStack Form só aplica defaultValues no mount).
          <AutoSaveRowForm
            key={row.data._id}
            table={table.data}
            rowId={rowId}
            existingRow={row.data}
            onBack={goToView}
            backGuardRef={backGuardRef}
          />
        )}
    </PageShell>
  );
}
