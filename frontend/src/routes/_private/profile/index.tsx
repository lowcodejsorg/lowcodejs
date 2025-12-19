import { createFileRoute } from '@tanstack/react-router';

import { LoadError } from '@/components/common/load-error';
import { useProfile } from '@/hooks/use-profile';
import { UpdateProfileForm } from './-update-form';
import { UpdateProfileFormSkeleton } from './-update-form-skeleton';

export const Route = createFileRoute('/_private/profile/')({
  component: RouteComponent,
});

function RouteComponent() {
  const _read = useProfile();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <h1 className="text-xl font-medium">Perfil do usuário</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {_read.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados do perfil"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateProfileFormSkeleton />}
        {_read.status === 'success' && (
          <UpdateProfileForm
            data={_read.data}
            key={_read.data._id}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
