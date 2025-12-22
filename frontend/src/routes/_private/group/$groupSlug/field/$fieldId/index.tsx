import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams, useRouter, useSearch } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import z from 'zod';

import { FieldUpdateForm } from '@/components/common/field-update-form';
import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSidebar } from '@/components/ui/sidebar';
import { API } from '@/lib/api';
import type { IField } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/group/$groupSlug/field/$fieldId/')({
  component: RouteComponent,
  validateSearch: z.object({
    from: z.string().optional(),
  }),
});

function RouteComponent(): React.JSX.Element {
  const { groupSlug, fieldId } = useParams({
    from: '/_private/group/$groupSlug/field/$fieldId/',
  });

  const { from } = useSearch({
    from: '/_private/group/$groupSlug/field/$fieldId/',
  });

  const originSlug = from ?? groupSlug;

  const sidebar = useSidebar();
  const router = useRouter();

  const _read = useQuery({
    queryKey: [`/tables/${groupSlug}/fields/${fieldId}`, fieldId],
    queryFn: async () => {
      const response = await API.get<IField>(
        `/tables/${groupSlug}/fields/${fieldId}`,
      );
      return response.data;
    },
    enabled: Boolean(groupSlug) && Boolean(fieldId),
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
                params: { slug: originSlug },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Detalhes do campo</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {_read.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados do campo"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && (
          <div className="p-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {_read.status === 'success' && (
          <FieldUpdateForm
            data={_read.data}
            tableSlug={groupSlug}
            originSlug={originSlug}
            key={_read.data._id}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
