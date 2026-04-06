import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';

import { PageSkeleton } from './-page-skeleton';

import { PageShell } from '@/components/common/page-shell';
import { ContentViewer } from '@/components/common/rich-editor/viewer';
import { pageDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/pages/$slug')({
  pendingComponent: PageSkeleton,
  component: RouteComponent,
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(pageDetailOptions(params.slug));
  },
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({
    from: '/_private/pages/$slug',
  });

  const { data: page } = useSuspenseQuery(pageDetailOptions(slug));

  return (
    <PageShell data-test-id="custom-page">
      <PageShell.Header>
        <h1 className="text-2xl font-medium ">{page?.name ?? ''}</h1>
      </PageShell.Header>

      <PageShell.Content>
        <ContentViewer content={page?.html ?? ''} />
      </PageShell.Content>

      <PageShell.Footer />
    </PageShell>
  );
}
