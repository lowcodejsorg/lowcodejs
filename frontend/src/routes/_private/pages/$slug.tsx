import { createFileRoute, useParams } from '@tanstack/react-router';

import { usePageRead } from '@/hooks/tanstack-query/use-page-read';

export const Route = createFileRoute('/_private/pages/$slug')({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = useParams({
    from: '/_private/pages/$slug',
  });

  // const sidebar = useSidebar();

  const page = usePageRead({ slug });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">{page.data?.name ?? ''}</h1>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <div
          className="prose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: page.data?.html ?? '' }}
        />
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
