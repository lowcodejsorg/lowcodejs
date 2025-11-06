import { Pagination } from "@/components/custom/pagination";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Paginated, UserGroup } from "@/lib/entity";
import { MetaDefault } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import z from "zod";
import { SheetCreateUserGroup } from "./-components/sheet-user-group-create";
import { TableUserGroup } from "./-components/table-user-group";

export const Route = createFileRoute("/_private/user-groups/")({
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
    from: "/_private/user-groups/",
  });

  const pagination = useQuery({
    queryKey: ["/user-group/paginated", search],
    queryFn: async function () {
      const route = "/user-group/paginated";
      const response = await API.get<Paginated<UserGroup[]>>(route, {
        params: {
          ...search,
        },
      });
      return response.data;
    },
  });

  // const criarGrupoDeUsuariosButtonRef = React.useRef<HTMLButtonElement | null>(
  //   null
  // );

  const headers = t("USER_GROUP_ROUTE_TABLE_HEADERS", [
    "Name",
    "Slug",
    "Description",
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">
          {t("USER_GROUP_ROUTE_TITLE", "User Groups")}
        </h1>

        <SheetCreateUserGroup />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <TableUserGroup
          data={pagination?.data?.data || []}
          headers={headers as string[]}
        />
      </div>

      <div className="flex-shrink-0 border-t p-2">
        <Pagination meta={pagination?.data?.meta ?? MetaDefault} />
      </div>

      {/* <SheetGrupoDeUsuarios.Criar ref={criarGrupoDeUsuariosButtonRef} /> */}
    </div>
  );
}
