import { Pagination } from "@/components/custom/pagination";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Collection, Paginated } from "@/lib/entity";
import { MetaDefault } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import z from "zod";
import { CreateCollectionSheet } from "./-components/create-collection.sheet";
import { FilterCollectionSheet } from "./-components/filter.sheet";
import { GalleryList } from "./-components/gallery.style";
import { ListStyle } from "./-components/list.style";
import { StyleButton } from "./-components/style.button";
import { TrashButton } from "./-components/trash.button";

export const Route = createFileRoute("/_private/collections/")({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    trashed: z.coerce.boolean().default(false),
    style: z.enum(["list", "gallery"]).default("list"),
    name: z.string().optional(),
  }),
});

function RouteComponent() {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  const pagination = useQuery({
    queryKey: [
      "/collections/paginated",
      {
        ...search,
      },
    ],
    queryFn: async () => {
      const response = await API.get<Paginated<Collection[]>>(
        "/collections/paginated",
        {
          params: {
            ...search,
          },
        }
      );
      return response.data;
    },
  });

  const headers = t("COLLECTION_ROUTE_TABLE_HEADERS", ["Name", "Type", "Link"]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">
          {t("COLLECTION_ROUTE_TITLE", "Collections")}
        </h1>

        <div className="inline-flex gap-2">
          <TrashButton />
          <StyleButton />
          <FilterCollectionSheet />
          <CreateCollectionSheet />
        </div>
      </div>

      {search.style === "list" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
          <ListStyle
            data={pagination?.data?.data ?? []}
            headers={headers as string[]}
          />
        </div>
      )}

      {search.style === "gallery" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
          <GalleryList
            data={pagination?.data?.data ?? []}
            headers={headers as string[]}
          />
        </div>
      )}

      <div className="flex-shrink-0 border-t p-2">
        <Pagination meta={pagination?.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
