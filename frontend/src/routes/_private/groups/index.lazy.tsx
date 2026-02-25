import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useRouter,
  useSearch,
} from '@tanstack/react-router';

import { TableGroups } from './-table-groups';

import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { groupListOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createLazyFileRoute('/_private/groups/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const search = useSearch({
    from: '/_private/groups/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const { data } = useSuspenseQuery(groupListOptions(search));

  const headers = ['Nome', 'Slug', 'Descrição'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">Grupos</h1>
        <Button
          className="disabled:cursor-not-allowed"
          onClick={() => {
            sidebar.setOpen(false);
            router.navigate({
              to: '/groups/create',
              replace: true,
            });
          }}
        >
          <span>Novo Grupo</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <TableGroups
          headers={headers}
          data={data.data}
        />
      </div>

      <div className="shrink-0 border-t p-2">
        <Pagination meta={data.meta} />
      </div>
    </div>
  );
}
