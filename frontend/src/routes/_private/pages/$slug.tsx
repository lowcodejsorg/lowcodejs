import { API } from '@/lib/api';
import { IMenu } from '@/lib/interfaces';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';

export const Route = createFileRoute('/_private/pages/$slug')({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = useParams({
    from: '/_private/pages/$slug',
  });

  // const sidebar = useSidebar();

  const page = useQuery({
    queryKey: ['/pages/'.concat(slug), slug],
    queryFn: async function () {
      const route = '/pages/'.concat(slug);
      const response = await API.get<IMenu>(route);
      return response.data;
    },
  });

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
