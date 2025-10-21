import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Collection } from "@/lib/entity";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import React from "react";
import { GalleryRowCell } from "./gallery-row-cell";

interface Props extends React.ComponentProps<typeof SheetPrimitive.Trigger> {
  _id: string;
}

export function RowCollectionShowSheet({ _id, ...props }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

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
    enabled: Boolean(slug) && Boolean(_id) && open,
  });

  const row = useQuery({
    queryKey: [
      "/collections/".concat(slug).concat("/rows/").concat(_id),
      slug,
      _id,
    ],
    queryFn: async () => {
      const route = "/collections/".concat(slug).concat("/rows/").concat(_id);
      const response = await API.get(route);
      return response.data;
    },
    enabled: Boolean(slug) && Boolean(_id) && open,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="hidden" {...props} />
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_SHOW_TITLE",
              "Detalhes do registro"
            )}
          </SheetTitle>
          <SheetDescription>
            {t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_SHOW_DESCRIPTION",
              "Visualizar detalhes do registro"
            )}
          </SheetDescription>
        </SheetHeader>

        {collection.status === "success" && row.status === "success" && (
          <section className="flex flex-col gap-4">
            {collection?.data?.fields?.map((field) => (
              <GalleryRowCell
                field={field}
                row={row.data}
                key={field._id?.concat("-").concat(row.data._id)}
                isSheet
              />
            ))}
          </section>
        )}
      </SheetContent>
    </Sheet>
  );
}
