import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Collection, Row } from "@/lib/entity";
// import * as SheetPrimitive from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import React from "react";
import { GalleryRowCell } from "./gallery-row-cell";

interface Props extends React.ComponentProps<typeof DialogTrigger> {
  _id: string;
}

export function RowCollectionShowDialog({ _id, ...props }: Props) {
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
      const response = await API.get<Row>(route);
      return response.data;
    },
    enabled: Boolean(slug) && Boolean(_id) && open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="hidden" {...props} />
      <DialogContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-[70vw] overflow-y-auto">
        <DialogHeader className="px-0">
          <DialogTitle className="text-lg font-medium">
            {t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_SHOW_TITLE",
              "Detalhes do registro"
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_SHOW_DESCRIPTION",
              "Visualizar detalhes do registro"
            )}
          </DialogDescription>
        </DialogHeader>

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
            <div className="flex flex-col">
              <span className="font-normal text-sm opacity-50">
                Criado em{" "}
                {format(row.data?.createdAt, "dd 'de' MMMM 'às' HH:mm")}
                {row?.data?.creator && (
                  <span> por {row?.data?.creator?.name}</span>
                )}
              </span>
            </div>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
