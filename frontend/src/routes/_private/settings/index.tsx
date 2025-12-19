import { createFileRoute } from '@tanstack/react-router';
import { SettingsIcon } from 'lucide-react';

export const Route = createFileRoute('/_private/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col space-y-2 items-center">
        <h1>Em manutenção</h1>
        <SettingsIcon className="animate-spin" />
      </div>
    </div>
  );
}
