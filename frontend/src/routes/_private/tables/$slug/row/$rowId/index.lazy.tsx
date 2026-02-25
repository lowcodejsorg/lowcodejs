import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import { ArrowLeftIcon, Share2Icon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { UpdateRowForm } from './-update-row-form';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import {
  rowDetailOptions,
  tableDetailOptions,
} from '@/hooks/tanstack-query/_query-options';

export const Route = createLazyFileRoute('/_private/tables/$slug/row/$rowId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();

  const { slug, rowId } = useParams({
    from: '/_private/tables/$slug/row/$rowId/',
  });

  const { data: table } = useSuspenseQuery(tableDetailOptions(slug));
  const { data: row } = useSuspenseQuery(rowDetailOptions(slug, rowId));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              sidebar.setOpen(false);
              router.navigate({
                to: '/tables/$slug',
                replace: true,
                params: { slug },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Detalhes do registro</h1>
          <Button
            variant="outline"
            className="shadow-none p-1 h-auto"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast('Link do registro copiado', {
                className:
                  '!bg-primary !text-primary-foreground !border-primary',
                description:
                  'O link do registro foi copiado para a área de transferência',
                closeButton: true,
              });
            }}
          >
            <Share2Icon />
            <span className="sr-only">Compartilhar</span>
          </Button>
        </div>
      </div>

      <UpdateRowForm
        table={table}
        data={row}
      />
    </div>
  );
}
