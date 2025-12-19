import { createFileRoute, Link, useParams } from '@tanstack/react-router';

import { ArrowLeftIcon } from 'lucide-react';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useReadMenu } from '../../../../tanstack-query/use-menu-read';
import { UpdateMenuForm } from './-update-form';
import { UpdateMenuFormSkeleton } from './-update-form-skeleton';

export const Route = createFileRoute('/_private/menus/$menuId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { menuId } = useParams({
    from: '/_private/menus/$menuId/',
  });

  const sidebar = useSidebar();

  const _read = useReadMenu({ menuId });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            onClick={() => {
              sidebar.setOpen(true);
            }}
          >
            <Link
              to="/menus"
              replace
              search={{ page: 1, perPage: 50 }}
            >
              <ArrowLeftIcon />
            </Link>
          </Button>
          <h1 className="text-xl font-medium">Detalhes do menu</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden relative">
        {_read.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados do menu"
            refetch={_read.refetch}
          />
        )}

        {_read.status === 'pending' && <UpdateMenuFormSkeleton />}

        {_read.status === 'success' && (
          <UpdateMenuForm
            data={_read.data}
            key={_read.data._id}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
