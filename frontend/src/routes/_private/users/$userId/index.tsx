import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';

import { ArrowLeftIcon } from 'lucide-react';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useReadUser } from '@/tanstack-query/use-user-read';
import { UpdateUserForm } from './-update-form';
import { UpdateUserFormSkeleton } from './-update-form-skeleton';

export const Route = createFileRoute('/_private/users/$userId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = useParams({
    from: '/_private/users/$userId/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const _read = useReadUser({ userId });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              sidebar.setOpen(true);
              router.navigate({
                to: '/users',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Detalhes do usuário</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {_read.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados do usuário"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateUserFormSkeleton />}
        {_read.status === 'success' && (
          <UpdateUserForm
            data={_read.data}
            key={_read.data._id}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
