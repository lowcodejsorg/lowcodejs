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

interface RowDeleteDialogProps
  extends React.ComponentProps<typeof DialogTrigger> {
  rowId: string;
}

export function RowDeleteDialog({ rowId, ...props }: RowDeleteDialogProps) {
  const { t } = useI18n();

  const { slug } = useParams({
    from: "/_private/collections/$slug/",
  });

  const search = useSearch({
    from: "/_private/collections/$slug/",
  });

  const [open, setOpen] = React.useState(false);

  const deleteRow = useMutation({
    mutationFn: async function () {
      const route = "/collections/".concat(slug).concat("/rows/").concat(rowId);
      const response = await API.delete(route);
      return response.data;
    },
    onSuccess() {
      setOpen(false);

      QueryClient.setQueryData<Paginated<Row[]>>(
        [
          "/collections/".concat(slug).concat("/rows/paginated"),
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

      toast("Linha deletada permanentemente!", {
        className: "!bg-green-600 !text-white !border-green-600",
        description: `A linha foi deletada permanentemente`,
        descriptionClassName: "!text-white",
        closeButton: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(data?.message ?? t("COLLECTION_ROW_ERROR_INVALID_ID", "Invalid record ID"));
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? t("COLLECTION_ERROR_AUTHENTICATION_REQUIRED", "Authentication required"));
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Acesso negado");
        }

        // 404 - ROW_NOT_FOUND
        if (data?.code === 404 && data?.cause === "ROW_NOT_FOUND") {
          toast.error(data?.message ?? t("COLLECTION_ROW_ERROR_NOT_FOUND", "Record not found"));
        }

        // 409 - ROW_IN_USE
        if (data?.code === 409 && data?.cause === "ROW_IN_USE") {
          toast.error(
            data?.message ?? t("COLLECTION_ROW_ERROR_CANNOT_DELETE_REFERENCED", "Cannot delete: record is being referenced")
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
              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_DELETE_TITLE",
              "Deletar linha permanentemente"
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_DELETE_DESCRIPTION",
              t("COLLECTION_ROW_DELETE_DESCRIPTION", "By confirming this action, the row will be permanently deleted and cannot be recovered")
            )}
          </DialogDescription>
        </DialogHeader>
        <section>
          <form className="pt-4 pb-2">
            <DialogFooter className="inline-flex w-full gap-2 justify-end">
              <DialogClose asChild>
                <Button className="bg-destructive hover:bg-destructive">
                  {t(
                    "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_CANCEL_BUTTON",
                    "Cancelar"
                  )}
                </Button>
              </DialogClose>
              <Button
                type="button"
                disabled={deleteRow.status === "pending"}
                onClick={() => {
                  deleteRow.mutateAsync();
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteRow.status === "pending" && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(deleteRow.status === "pending") && (
                  <span>
                    {/* {t(
                      "COLLECTION_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_DELETE_BUTTON",
                      "Deletar Permanentemente"
                    )} */}
                    Delete
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
