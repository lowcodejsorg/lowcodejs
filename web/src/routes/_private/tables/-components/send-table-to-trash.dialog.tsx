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
import type { Paginated, Table } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { useMutation } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { LoaderCircleIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface SendToTrashProps extends React.ComponentProps<typeof DialogTrigger> {
  slug: string;
}

export function SendTableToTrash({ slug, ...props }: SendToTrashProps) {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  const [open, setOpen] = React.useState(false);

  const sendToTrash = useMutation({
    mutationFn: async function () {
      const route = "/tables/".concat(slug).concat("/trash");
      const response = await API.patch<Table>(route);
      return response.data;
    },
    onSuccess(data) {
      setOpen(false);

      toast(t("TABLE_TOAST_SENT_TO_TRASH", "Table sent to trash!"), {
        className: "!bg-green-600 !text-white !border-green-600",
        description: `A coleção "${data.name}" foi movida para a lixeira`,
        descriptionClassName: "!text-white",
        closeButton: true,
      });

      QueryClient.setQueryData<Paginated<Table[]>>(
        ["/tables/paginated", { ...search }],
        (old) => {
          if (!old) return old;
          return {
            meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
            data: old.data.filter((item) => item.slug !== slug),
          };
        }
      );

      QueryClient.setQueryData<Paginated<Table[]>>(
        ["/tables/paginated", { ...search, trashed: true }],
        (old) => {
          if (!old) return old;
          return {
            meta: { ...old.meta, total: old.meta.total + 1 },
            data: [data, ...old.data],
          };
        }
      );

      QueryClient.setQueryData<Table>(
        ["/tables/".concat(data.slug), data.slug],
        data
      );
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ?? t("TABLE_ERROR_INVALID_DATA", "Invalid data")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t("TABLE_ERROR_AUTH_REQUIRED", "Authentication required")
          );
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Acesso negado");
        }

        // 404 - TABLE_NOT_FOUND
        if (data?.code === 404 && data?.cause === "TABLE_NOT_FOUND") {
          toast.error(
            data?.message ?? t("TABLE_ERROR_NOT_FOUND", "Table not found")
          );
        }

        // 409 - TABLE_IN_USE
        if (data?.code === 409 && data?.cause === "TABLE_IN_USE") {
          toast.error(
            data?.message ??
              t(
                "TABLE_ERROR_CANNOT_TRASH_HAS_DATA",
                "Cannot move to trash: table has data"
              )
          );
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
              t("TABLE_DIALOG_SEND_TO_TRASH_TITLE", "Send table to trash")
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_TRASH_DESCRIPTION",
              t(
                "TABLE_DIALOG_SEND_TO_TRASH_DESCRIPTION",
                "By confirming this action, the table will be sent to trash"
              )
            )}
          </DialogDescription>
        </DialogHeader>
        <section>
          <form className="pt-4 pb-2">
            <DialogFooter className="inline-flex w-full gap-2 justify-end">
              <DialogClose asChild>
                <Button className="bg-destructive  hover:bg-destructive">
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
