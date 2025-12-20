import { LoadError } from '@/components/common/load-error';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { API } from '@/lib/api';
import { MetaDefault } from '@/lib/constant';
import { ITable, Paginated } from '@/lib/interfaces';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router';
import z from 'zod';
import { TableTables } from './-table-tables';
import { TableTablesSkeleton } from './-table-tables-skeleton';

export const Route = createFileRoute('/_private/tables/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent() {
  const search = useSearch({
    from: '/_private/tables/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const pagination = useQuery({
    queryKey: ['/tables/paginated', search],
    queryFn: async () => {
      const response = await API.get<Paginated<ITable>>('/tables/paginated', {
        params: {
          ...search,
        },
      });
      return response.data;
    },
  });

  const headers = ['Tabela', 'Link (slug)', 'Criado em'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">Tabelas</h1>
        <Button
          disabled={
            pagination.status === 'pending' || pagination.status === 'error'
          }
          className="disabled:cursor-not-allowed"
          onClick={() => {
            sidebar.setOpen(false);
            router.navigate({
              to: '/tables/create',
              replace: true,
            });
          }}
        >
          <span>Nova Tabela</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === 'pending' && (
          <TableTablesSkeleton headers={headers} />
        )}

        {pagination.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados das tabelas"
            refetch={pagination.refetch}
          />
        )}

        {pagination.status === 'success' && (
          <TableTables
            headers={headers as string[]}
            data={pagination.data?.data || []}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2">
        <Pagination meta={pagination?.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
