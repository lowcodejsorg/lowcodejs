import { Pagination } from "@/components/common/pagination";
import { API } from "@/lib/api";
import type { Menu, Paginated } from "@/lib/entity";
import { MetaDefault } from "@/lib/utils";
import { MantineProvider } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import z from "zod";
import { SheetMenuCreate } from "./-components/sheet-menu-create";
import { TableMenu } from "./-components/table-menu";

export const Route = createFileRoute("/_private/menu-management/")({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent() {
  const search = useSearch({
    from: "/_private/menu-management/",
  });

  const pagination = useQuery({
    queryKey: ["/menu/paginated", search],
    queryFn: async () => {
      const response = await API.get<Paginated<Menu[]>>("/menu/paginated", {
        params: {
          ...search,
        },
      });
      return response.data;
    },
  });

  const headers = ["Nome", "Slug", "Tipo"];

  return (
    <MantineProvider>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
          <h1 className="text-2xl font-medium">Gestão de Menu</h1>
          <SheetMenuCreate />
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
          <TableMenu
            headers={headers as string[]}
            data={pagination.data?.data || []}
          />
        </div>

        <div className="shrink-0 border-t p-2">
          <Pagination meta={pagination?.data?.meta ?? MetaDefault} />
        </div>
      </div>
    </MantineProvider>
  );
}
