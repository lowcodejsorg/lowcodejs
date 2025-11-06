import { Pagination } from "@/components/custom/pagination";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Paginated, User } from "@/lib/entity";
import { MetaDefault } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import z from "zod";
import { SheetUserCreate } from "./-components/sheet-user-create";
import { TableUsers } from "./-components/table-user";

export const Route = createFileRoute("/_private/users/")({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent() {
  const { t } = useI18n();

  const search = useSearch({
    from: "/_private/users/",
  });

  const pagination = useQuery({
    queryKey: ["/users/paginated", search],
    queryFn: async () => {
      const response = await API.get<Paginated<User[]>>("/users/paginated", {
        params: {
          ...search,
        },
      });
      return response.data;
    },
  });

  const headers = t("USER_ROUTE_TABLE_HEADERS", [
    "Name",
    "E-mail",
    "Role",
    "Status",
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">
          {t("USER_ROUTE_TITLE", "Users")}
        </h1>
        <SheetUserCreate />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <TableUsers
          headers={headers as string[]}
          data={pagination.data?.data || []}
        />
      </div>

      <div className="flex-shrink-0 border-t p-2">
        <Pagination meta={pagination?.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
