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

interface RowRemoveFromTrashDialogProps
  extends React.ComponentProps<typeof DialogTrigger> {
  rowId: string;
}

export function RowRemoveFromTrashDialog({
  rowId,
  ...props
}: RowRemoveFromTrashDialogProps) {
  const { t } = useI18n();

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const search = useSearch({
    from: "/_private/tables/$slug/",
  });

  const [open, setOpen] = React.useState(false);

  const removeFromTrash = useMutation({
    mutationFn: async function () {
      const route = "/tables/"
        .concat(slug)
        .concat("/rows/")
        .concat(rowId)
        .concat("/restore");
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
          { ...search, trashed: false },
        ],
        (old) => {
          if (!old) return old;
          return {
            meta: { ...old.meta, total: old.meta.total + 1 },
            data: [data, ...old.data],
          };
        }
      );

      toast(t("TOAST_ROW_RESTORED", "Row restored!"), {
        className: "!bg-green-600 !text-white !border-green-600",
        description: t(
          "TOAST_ROW_RESTORED_DESCRIPTION",
          "The row was restored from trash"
        ),
        descriptionClassName: "!text-white",
        closeButton: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ?? t("ERROR_INVALID_RECORD_ID", "Invalid record ID")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t("ERROR_AUTHENTICATION_REQUIRED", "Authentication required")
          );
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ?? t("ERROR_ACCESS_DENIED", "Access denied")
          );
        }

        // 404 - ROW_NOT_FOUND
        if (data?.code === 404 && data?.cause === "ROW_NOT_FOUND") {
          toast.error(
            data?.message ??
              t("ERROR_RECORD_NOT_FOUND_IN_TRASH", "Record not found in trash")
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(
            data?.message ?? t("ERROR_SERVER_ERROR", "Internal server error")
          );
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
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_RESTORE_TITLE",
              "Restaurar linha da lixeira"
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_RESTORE_DESCRIPTION",
              t(
                "TABLE_ROW_RESTORE_DESCRIPTION",
                "By confirming this action, the row will be restored from trash"
              )
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
                disabled={removeFromTrash.status === "pending"}
                onClick={() => {
                  removeFromTrash.mutateAsync();
                }}
              >
                {removeFromTrash.status === "pending" && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(removeFromTrash.status === "pending") && (
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
