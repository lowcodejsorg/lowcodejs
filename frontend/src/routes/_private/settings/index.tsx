import { createFileRoute } from '@tanstack/react-router';

import { LoadError } from '@/components/common/load-error';
import { useSetting } from '@/hooks/use-setting';
import { UpdateSettingForm } from './-update-form';
import { UpdateSettingFormSkeleton } from './-update-form-skeleton';

export const Route = createFileRoute('/_private/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  const _read = useSetting();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <h1 className="text-xl font-medium">Configurações do Sistema</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {_read.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar configurações do sistema"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateSettingFormSkeleton />}
        {_read.status === 'success' && (
          <UpdateSettingForm
            data={_read.data}
            key={_read.data.LOCALE}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
