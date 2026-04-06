import { useSuspenseQuery } from '@tanstack/react-query';
import { createLazyFileRoute, useParams } from '@tanstack/react-router';

import { PageShell } from '@/components/common/page-shell';
import { ContentViewer } from '@/components/common/rich-editor/viewer';
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
