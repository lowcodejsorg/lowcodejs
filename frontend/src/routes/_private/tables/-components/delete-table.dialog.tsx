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

interface DeleteProps extends React.ComponentProps<typeof DialogTrigger> {
  slug: string;
}

export function DeleteTable({ slug, ...props }: DeleteProps) {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  const [open, setOpen] = React.useState(false);

  const _delete = useMutation({
    mutationFn: async function () {
      const route = "/tables/".concat(slug);
      const response = await API.delete<Table>(route);
      return response.data;
    },
    onSuccess() {
      setOpen(false);

      toast(t("TABLE_TOAST_DELETED_PERMANENTLY", "Table deleted!"), {
        className: "!bg-green-600 !text-white !border-green-600",
        description: t(
          "TABLE_TOAST_DELETED_PERMANENTLY_DESCRIPTION",
          "The table has been permanently deleted"
        ),
        descriptionClassName: "!text-white",
        closeButton: true,
      });

      QueryClient.setQueryData<Paginated<Table[]>>(
        ["/tables/paginated", search],
        (old) => {
          if (!old) return old;

          return {
            meta: {
              ...old.meta,
              total: Math.max(0, old.meta.total - 1),
            },
            data: old.data.filter((item) => item.slug !== slug),
          };
        }
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
          toast.error(
            data?.message ?? t("GLOBAL_ERROR_ACCESS_DENIED", "Acesso negado")
          );
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
                "TABLE_ERROR_CANNOT_DELETE_HAS_RELATIONSHIPS",
                "Cannot delete: table has relationships"
              )
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(
            data?.message ?? t("GLOBAL_ERROR_SERVER_ERROR", "Erro interno do servidor")
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
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_DELETE_TITLE",
              t("TABLE_DIALOG_DELETE_TITLE", "Remove table")
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_MODAL_DELETE_DESCRIPTION",
              t(
                "TABLE_DIALOG_DELETE_DESCRIPTION",
                "By confirming this action, the table will be permanently removed."
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
                disabled={_delete.status === "pending"}
                onClick={() => {
                  _delete.mutateAsync();
                }}
              >
                {_delete.status === "pending" && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(_delete.status === "pending") && (
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
