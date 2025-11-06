import { Button } from "@/components/ui/button";
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
import type { Row, Table } from "@/lib/entity";
// import * as SheetPrimitive from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { Copy, ExternalLink, Share2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { GalleryRowCell } from "./gallery-row-cell";

interface Props extends React.ComponentProps<typeof DialogTrigger> {
  _id: string;
}

export function RowTableShowDialog({ _id, ...props }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const generateRecordLink = React.useCallback(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/tables/${slug}?record=${_id}`;
  }, [slug, _id]);

  const handleCopyLink = React.useCallback(async () => {
    try {
      const link = generateRecordLink();
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado para a área de transferência!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao copiar link");
    }
  }, [generateRecordLink]);

  const handleOpenLink = React.useCallback(() => {
    const link = generateRecordLink();
    window.open(link, "_blank");
  }, [generateRecordLink]);

  const handleShare = React.useCallback(async () => {
    const link = generateRecordLink();
    const shareTitle = "Registro da tabela";
    const shareText = "Confira este registro";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: link,
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        if ((error as Error).name !== "AbortError") {
          handleCopyLink(); // Fallback to copying link
        }
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyLink();
    }
  }, [generateRecordLink, handleCopyLink]);

  const table = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(slug) && Boolean(_id) && open,
  });

  const row = useQuery({
    queryKey: ["/tables/".concat(slug).concat("/rows/").concat(_id), slug, _id],
    queryFn: async () => {
      const route = "/tables/".concat(slug).concat("/rows/").concat(_id);
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col space-y-1.5">
              <DialogTitle className="text-lg font-medium">
                {t(
                  "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_SHOW_TITLE",
                  "Detalhes do registro"
                )}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_SHOW_DESCRIPTION",
                  "Visualizar detalhes do registro"
                )}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2 flex-1 sm:flex-none"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copiar link</span>
                <span className="sm:hidden">Copiar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenLink}
                className="gap-2 flex-1 sm:flex-none"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Abrir</span>
                <span className="sm:hidden">Abrir</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleShare}
                className="gap-2 flex-1 sm:flex-none"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>
          </div>
        </DialogHeader>

        {table.status === "success" && row.status === "success" && (
          <section className="flex flex-col gap-4">
            {table?.data?.fields?.map((field) => (
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
