import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Paginated, Table, TablePayload } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import {
  LayoutDashboardIcon,
  LayoutListIcon,
  LoaderCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

export function TableStyleButton() {
  const { t } = useI18n();

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const search = useSearch({
    from: "/_private/tables/$slug/",
  });

  const table = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const update = useMutation({
    mutationFn: async function (payload: TablePayload) {
      const route = "/tables/".concat(slug);
      const response = await API.put<Table>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      QueryClient.setQueryData<Table>(
        ["/tables/".concat(data.slug), data.slug],
        data
      );

      QueryClient.setQueryData<Paginated<Table[]>>(
        ["/tables/paginated", search],
        (old) => {
          if (!old) return old;

          return {
            meta: old.meta,
            data: old.data.map((item) => {
              if (item._id === data._id) {
                return data;
              }
              return item;
            }),
          };
        }
      );
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(data?.message ?? "Dados inválidos");
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ??
              "Permissões insuficientes para atualizar esta coleção"
          );
        }

        // 404 - TABLE_NOT_FOUND
        if (data?.code === 404 && data?.cause === "TABLE_NOT_FOUND") {
          toast.error(data?.message ?? "Coleção não encontrada");
        }

        // 409 - TABLE_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "TABLE_ALREADY_EXISTS") {
          toast.error(data?.message ?? "Coleção com este nome já existe");
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(data?.message ?? "Valores de configuração inválidos");
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500 && data?.cause === "SERVER_ERROR") {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  return (
    <DropdownMenu dir="ltr" modal={false}>
      <DropdownMenuTrigger
        asChild
        disabled={
          (table.status === "success" && table?.data?.fields?.length === 0) ||
          table.status === "pending" ||
          update.status === "pending"
        }
      >
        <Button className={cn("shadow-none p-1 h-auto")} variant="outline">
          {table?.data?.configuration?.style === "gallery" && (
            <>
              {update.status === "pending" && (
                <LoaderCircleIcon className="w-4 h-4 animate-spin" />
              )}
              {!(update.status === "pending") && (
                <LayoutDashboardIcon className="w-4 h-4  " />
              )}
            </>
          )}
          {table?.data?.configuration?.style === "list" && (
            <>
              {update.status === "pending" && (
                <LoaderCircleIcon className="w-4 h-4 animate-spin" />
              )}
              {!(update.status === "pending") && (
                <LayoutListIcon className="w-4 h-4  " />
              )}
            </>
          )}
          {t("TABLE_DROPDOWN_LAYOUT_LABEL", "Exibição")}
        </Button>
      </DropdownMenuTrigger>
      {table.status === "success" && (
        <DropdownMenuContent className="max-w-xs">
          <DropdownMenuRadioGroup
            value={table?.data?.configuration?.style ?? "list"}
          >
            <DropdownMenuRadioItem
              value="list"
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                update.mutateAsync({
                  ...table.data,
                  fields: table?.data?.fields?.map((f) => f._id) ?? [],
                  configuration: {
                    ...table?.data?.configuration,
                    style: "list",
                    administrators:
                      table?.data?.configuration?.administrators?.flatMap(
                        (a) => a._id
                      ) ?? [],
                    owner: table?.data?.configuration?.owner?._id ?? "",
                  },
                  logo: table?.data?.logo?._id ?? null,
                });
              }}
            >
              <LayoutListIcon className="w-4 h-4" />
              <span> {t("TABLE_LAYOUT_LIST_LABEL", "Lista")}</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              className="inline-flex space-x-1 w-full"
              value="gallery"
              onClick={() => {
                update.mutateAsync({
                  ...table.data,
                  fields: table?.data?.fields?.map((f) => f._id) ?? [],
                  configuration: {
                    ...table?.data?.configuration,
                    style: "gallery",
                    administrators:
                      table?.data?.configuration?.administrators?.flatMap(
                        (a) => a._id
                      ) ?? [],
                    owner: table?.data?.configuration?.owner?._id ?? "",
                  },
                  logo: table?.data?.logo?._id ?? null,
                });
              }}
            >
              <LayoutDashboardIcon className="w-4 h-4" />
              <span> {t("TABLE_LAYOUT_GRID_LABEL", "Galeria")}</span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
