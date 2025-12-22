import { createFileRoute, useParams, useRouter, useSearch } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import z from 'zod';

import { FieldCreateForm } from '@/components/common/field-create-form';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export const Route = createFileRoute('/_private/group/$groupSlug/field/create/')({
  component: RouteComponent,
  validateSearch: z.object({
    from: z.string().optional(),
  }),
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();

  const { groupSlug } = useParams({
    from: '/_private/group/$groupSlug/field/create/',
  });

  const { from } = useSearch({
    from: '/_private/group/$groupSlug/field/create/',
  });

  const originSlug = from ?? groupSlug;

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
          <h1 className="text-xl font-medium">Novo campo do grupo</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <FieldCreateForm tableSlug={groupSlug} originSlug={originSlug} />
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
