import { useSuspenseQuery } from '@tanstack/react-query';
import { createLazyFileRoute, useParams } from '@tanstack/react-router';

import { ContentViewer } from '@/components/common/rich-editor';
import { pageDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createLazyFileRoute('/_private/pages/$slug')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({
    from: '/_private/pages/$slug',
  });

  const { data: page } = useSuspenseQuery(pageDetailOptions(slug));

  return (
    <div className="flex flex-col h-full overflow-hidden" data-test-id="custom-page">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">{page?.name ?? ''}</h1>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <ContentViewer content={page?.html ?? ''} />
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
