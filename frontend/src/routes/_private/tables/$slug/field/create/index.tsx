import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

import { FieldCreateForm } from '@/components/common/field-create-form';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export const Route = createFileRoute('/_private/tables/$slug/field/create/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();

  const { slug } = useParams({
    from: '/_private/tables/$slug/field/create/',
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
          <h1 className="text-xl font-medium">Novo campo</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <FieldCreateForm tableSlug={slug} originSlug={slug} />
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
