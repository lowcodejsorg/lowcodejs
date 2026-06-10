import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { ShieldXIcon } from 'lucide-react';
import React from 'react';

import { ExistingRowView } from '../row/-existing-row-view';
import { RowDetailSkeleton } from '../row/-row-detail-skeleton';

import { LoginButton } from '@/components/common/layout/login-button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useSidebar } from '@/components/ui/sidebar';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { rowBySlugOptions } from '@/hooks/tanstack-query/_query-options';
import { useAuthStore } from '@/stores/authentication';

export const Route = createLazyFileRoute('/_private/tables/$slug/$rowSlug/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug, rowSlug } = useParams({
    from: '/_private/tables/$slug/$rowSlug/',
  });
  const router = useRouter();
  const sidebar = useSidebar();
  const isAuthenticated = Boolean(useAuthStore((s) => s.user));
  const queryClient = useQueryClient();

  const row = useQuery(rowBySlugOptions(slug, rowSlug));

  // Semeia o cache por _id para o ExistingRowView aproveitar sem refetch.
  React.useEffect(() => {
    if (row.data) {
      queryClient.setQueryData(
        queryKeys.rows.detail(slug, row.data._id),
        row.data,
      );
    }
  }, [row.data, slug, queryClient]);

  const goBack = (): void => {
    sidebar.setOpen(false);
    router.navigate({ to: '/tables/$slug', replace: true, params: { slug } });
  };

  if (row.status === 'pending') {
    return <RowDetailSkeleton />;
  }

  if (row.status === 'error') {
    let cause: string | undefined;
    let httpStatus: number | undefined;
    if (isAxiosError(row.error)) {
      const data: unknown = row.error.response?.data;
      if (typeof data === 'object' && data !== null && 'cause' in data) {
        cause = String((data as { cause?: unknown }).cause);
      }
      httpStatus = row.error.response?.status;
    }

    const isAccessDenied =
      cause === 'TABLE_PRIVATE' ||
      cause === 'FORM_VIEW_RESTRICTED' ||
      httpStatus === 403 ||
      httpStatus === 401;

    if (isAccessDenied) {
      let message = 'Você não tem permissão para acessar este registro';
      if (cause === 'TABLE_PRIVATE') message = 'Esta tabela é privada';
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
      <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldXIcon />
          </EmptyMedia>
          <EmptyTitle>Registro não encontrado</EmptyTitle>
          <EmptyDescription>
            O registro que você procura não existe ou foi removido.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ExistingRowView
      slug={slug}
      rowId={row.data._id}
      mode="view"
      onBack={goBack}
    />
  );
}
