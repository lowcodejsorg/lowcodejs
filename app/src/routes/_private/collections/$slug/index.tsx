import { Pagination } from "@/components/custom/pagination";
import { Button } from "@/components/ui/button";
import { API } from "@/lib/api";
import { type Collection, type Paginated, type Row } from "@/lib/entity";
import { MetaDefault } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useParams,
  useRouter,
  useSearch,
} from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import z from "zod";
import { TrashButton } from "../-components/trash.button";
import { CollectionConfigurationDropdown } from "./-components/collection-configuration-dropdown";
import { CollectionFiltersSheet } from "./-components/collection-filters-sheet";
import { CollectionStyleButton } from "./-components/collection-style-button";

import { Gallery } from "./-components/gallery.style";
import { List } from "./-components/list.style";
import { RowCollectionCreateSheet } from "./-components/row-collection-create-sheet";

export const Route = createFileRoute("/_private/collections/$slug/")({
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
  const router = useRouter();

  const search = useSearch({
    from: "/_private/collections/$slug/",
  });

  const { slug } = useParams({
    from: "/_private/collections/$slug/",
  });

  const collection = useQuery({
    queryKey: ["/collections/".concat(slug), slug],
    queryFn: async () => {
      const route = "/collections/".concat(slug);
      const response = await API.get<Collection>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const pagination = useQuery({
    queryKey: [
      "/collections/".concat(slug).concat("/rows/paginated"),
      slug,
      search,
    ],
    queryFn: async () => {
      const route = "/collections/".concat(slug).concat("/rows/paginated");
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
                if (collection?.data?.type === "field-group") {
                  router.history.back();
                  return;
                }

                router.navigate({
                  to: "/collections",
                  replace: true,
                });
              }}
            >
              <ArrowLeftIcon />
            </Button>

            <div className="flex flex-col">
              <h2 className="text-2xl font-medium">{collection?.data?.name}</h2>
            </div>
          </div>

          <div className="inline-flex items-start gap-2">
            <CollectionFiltersSheet />
            <CollectionStyleButton />
            <CollectionConfigurationDropdown />
            <TrashButton />
            {!search.trashed && collection?.data?.type === "collection" && (
              <RowCollectionCreateSheet />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === "success" &&
          collection?.status === "success" &&
          collection?.data?.configuration?.style === "list" && (
            <List
              data={pagination?.data?.data ?? []}
              headers={collection?.data?.fields ?? []}
              order={collection?.data?.configuration?.fields?.orderList ?? []}
            />
          )}

        {pagination.status === "success" &&
          collection?.status === "success" &&
          collection?.data?.configuration?.style === "gallery" && (
            <Gallery
              data={pagination?.data?.data ?? []}
              headers={collection?.data?.fields ?? []}
              order={collection?.data?.configuration?.fields?.orderList ?? []}
            />
          )}
      </div>

      <div className="flex-shrink-0 border-t p-2">
        <Pagination meta={pagination?.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
