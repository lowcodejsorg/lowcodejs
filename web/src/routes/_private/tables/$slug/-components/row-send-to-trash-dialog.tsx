import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Paginated, Row } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { useMutation } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";

import { AxiosError } from "axios";
import { LoaderCircleIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface RowSendToTrashDialogProps
  extends React.ComponentProps<typeof DialogTrigger> {
  rowId: string;
}

export function RowSendToTrashDialog({
  rowId,
  ...props
}: RowSendToTrashDialogProps) {
  const { t } = useI18n();

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const search = useSearch({
    from: "/_private/tables/$slug/",
  });

  const [open, setOpen] = React.useState(false);

  const sendToTrash = useMutation({
    mutationFn: async function () {
      const route = "/tables/"
        .concat(slug)
        .concat("/rows/")
        .concat(rowId)
        .concat("/trash");
      const response = await API.patch<Row>(route);
      return response.data;
    },
    onSuccess(data) {
      setOpen(false);

      QueryClient.setQueryData<Paginated<Row[]>>(
        [
          "/tables/".concat(slug).concat("/rows/paginated"),
          slug,
          { ...search },
        ],
        (old) => {
          if (!old) return old;
          return {
            meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
            data: old.data.filter((item) => item._id !== rowId),
          };
        }
      );

      QueryClient.setQueryData<Paginated<Row[]>>(
        [
          "/tables/".concat(slug).concat("/rows/paginated"),
          slug,
          { ...search, trashed: true },
        ],
        (old) => {
          if (!old) return old;
          return {
            meta: { ...old.meta, total: old.meta.total + 1 },
            data: [data, ...old.data],
          };
        }
      );

      toast("Linha enviada para lixeira!", {
        className: "!bg-green-600 !text-white !border-green-600",
        description: `A linha foi movida para a lixeira`,
        descriptionClassName: "!text-white",
        closeButton: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(data?.message ?? "ID do registro inválido");
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Acesso negado");
        }

        // 404 - ROW_NOT_FOUND
        if (data?.code === 404 && data?.cause === "ROW_NOT_FOUND") {
          toast.error(data?.message ?? "Registro não encontrado");
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogTrigger className="hidden" {...props} />
      <DialogContent className="py-4 px-6">
        <DialogHeader>
          <DialogTitle>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_TRASH_TITLE",
              "Enviar linha para a lixeira"
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_TRASH_DESCRIPTION",
              "Ao confirmar essa ação, a linha será enviada para a lixeira"
            )}
          </DialogDescription>
        </DialogHeader>
        <section>
          <form className="pt-4 pb-2">
            <DialogFooter className="inline-flex w-full gap-2 justify-end">
              <DialogClose asChild>
                <Button className="bg-destructive hover:bg-destructive">
                  {t(
                    "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_CANCEL_BUTTON",
                    "Cancelar"
                  )}
                </Button>
              </DialogClose>
              <Button
                type="button"
                disabled={sendToTrash.status === "pending"}
                onClick={() => {
                  sendToTrash.mutateAsync();
                }}
              >
                {sendToTrash.status === "pending" && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(sendToTrash.status === "pending") && (
                  <span>
                    {t(
                      "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_CONFIRM_BUTTON",
                      "Confirmar"
                    )}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
