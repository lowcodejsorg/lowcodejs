import { Pagination } from "@/components/custom/pagination";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import { type Paginated, type Row, type Table } from "@/lib/entity";
import { MetaDefault } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useParams,
  useRouter,
  useSearch,
} from "@tanstack/react-router";
import { ArrowLeftIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { TrashButton } from "../-components/trash.button";

import { Gallery } from "./-components/gallery.style";
import { List } from "./-components/list.style";
import { RowTableCreateSheet } from "./-components/row-table-create-sheet";
import { TableConfigurationDropdown } from "./-components/table-configuration-dropdown";
import { TableFiltersSheet } from "./-components/table-filters-sheet";
import { TableStyleButton } from "./-components/table-style-button";

export const Route = createFileRoute("/_private/tables/$slug/")({
  component: RouteComponent,
  validateSearch: z
    .object({
      search: z.string().optional(),
      page: z.coerce.number().default(1),
      perPage: z.coerce.number().default(50),
      trashed: z.coerce.boolean().default(false),
    })
    .loose(),
});

function RouteComponent() {
  const { t } = useI18n();
  const router = useRouter();

  const search = useSearch({
    from: "/_private/tables/$slug/",
  });

  const { slug } = useParams({
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

  const pagination = useQuery({
    queryKey: ["/tables/".concat(slug).concat("/rows/paginated"), slug, search],
    queryFn: async () => {
      const route = "/tables/".concat(slug).concat("/rows/paginated");
      const response = await API.get<Paginated<Row[]>>(route, {
        params: {
          ...search,
        },
      });
      return response.data;
    },
    enabled: Boolean(slug),
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-2 flex flex-col gap-1 border-b">
        <div className="flex-1 flex flex-col gap-6 lg:flex-row lg:justify-between">
          <div className="inline-flex items-start gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                if (table?.data?.type === "field-group") {
                  router.history.back();
                  return;
                }

                router.navigate({
                  to: "/tables",
                  replace: true,
                });
              }}
            >
              <ArrowLeftIcon />
            </Button>

            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2">
                <h2 className="text-2xl font-medium">{table?.data?.name}</h2>
                <Button
                  className="cursor-copy h-auto p-1"
                  variant="outline"
                  onClick={() => {
                    const link = window.location.href;

                    navigator.clipboard.writeText(link);

                    toast(t("TABLE_TOAST_LINK_COPIED", "Link copied"), {
                      className:
                        "!bg-primary !text-primary-foreground !border-primary",
                      description: t(
                        "TABLE_TOAST_LINK_COPIED_DESCRIPTION",
                        "The link was copied successfully"
                      ),
                      descriptionClassName: "!text-primary-foreground",
                      closeButton: true,
                    });
                  }}
                >
                  <Share2Icon className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="inline-flex items-start gap-2">
            <TableFiltersSheet />
            <TableStyleButton />
            <TableConfigurationDropdown />
            <TrashButton />
            {!search.trashed && table?.data?.type === "table" && (
              <RowTableCreateSheet />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === "success" &&
          table?.status === "success" &&
          table?.data?.configuration?.style === "list" && (
            <List
              data={pagination?.data?.data ?? []}
              headers={table?.data?.fields ?? []}
              order={table?.data?.configuration?.fields?.orderList ?? []}
            />
          )}

        {pagination.status === "success" &&
          table?.status === "success" &&
          table?.data?.configuration?.style === "gallery" && (
            <Gallery
              data={pagination?.data?.data ?? []}
              headers={table?.data?.fields ?? []}
              order={table?.data?.configuration?.fields?.orderList ?? []}
            />
          )}
      </div>

      <div className="flex-shrink-0 border-t p-2">
        <Pagination meta={pagination?.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
