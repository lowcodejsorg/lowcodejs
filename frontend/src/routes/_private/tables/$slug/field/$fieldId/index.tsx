import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

import { UpdateFieldForm } from './-update-form';
import { UpdateFieldFormSkeleton } from './-update-form-skeleton';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { API } from '@/lib/api';
import type { IField } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/$slug/field/$fieldId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug, fieldId } = useParams({
    from: '/_private/tables/$slug/field/$fieldId/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const _read = useQuery({
    queryKey: [`/tables/${slug}/fields/${fieldId}`, fieldId],
    queryFn: async () => {
      const response = await API.get<IField>(
        `/tables/${slug}/fields/${fieldId}`,
      );
      return response.data;
    },
    enabled: Boolean(slug) && Boolean(fieldId),
  });

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
          <h1 className="text-xl font-medium">Detalhes do campo</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {_read.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados do campo"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateFieldFormSkeleton />}
        {_read.status === 'success' && (
          <UpdateFieldForm
            data={_read.data}
            tableSlug={slug}
            key={_read.data._id}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
