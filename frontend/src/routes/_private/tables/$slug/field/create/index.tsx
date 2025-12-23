import {
  createFileRoute,
  useParams,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import z from 'zod';

import { FieldCreateForm } from '@/components/common/field-create-form';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { FIELD_TYPE } from '@/lib/constant';

export const Route = createFileRoute('/_private/tables/$slug/field/create/')({
  component: RouteComponent,
  validateSearch: z.object({
    'field-type': z
      .enum(Object.keys(FIELD_TYPE) as [string, ...Array<string>])
      .optional(),
    from: z.string().optional(),
  }),
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();

  const { slug } = useParams({
    from: '/_private/tables/$slug/field/create/',
  });

  const { 'field-type': fieldType, from } = useSearch({
    from: '/_private/tables/$slug/field/create/',
  });

  const originSlug = from ?? slug;

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
                params: { slug: originSlug },
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
        <FieldCreateForm
          tableSlug={slug}
          originSlug={originSlug}
          defaultFieldType={fieldType as keyof typeof FIELD_TYPE | undefined}
        />
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
