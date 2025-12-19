import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { CreateUserForm } from './-create-form';

export const Route = createFileRoute('/_private/users/create/')({
  component: RouteComponent,
});

function RouteComponent() {
  const sidebar = useSidebar();

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
              to="/users"
              replace
              search={{ page: 1, perPage: 50 }}
            >
              <ArrowLeftIcon />
            </Link>
          </Button>
          <h1 className="text-xl font-medium">Criar novo usuário</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <CreateUserForm />
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
