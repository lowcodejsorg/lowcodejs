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

interface RemoveFromTrashProps
  extends React.ComponentProps<typeof DialogTrigger> {
  slug: string;
}

export function RemoveTableFromTrash({ slug, ...props }: RemoveFromTrashProps) {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  const [open, setOpen] = React.useState(false);

  const RemoveFromTrash = useMutation({
    mutationFn: async function () {
      const route = "/tables/".concat(slug).concat("/restore");
      const response = await API.patch<Table>(route);
      return response.data;
    },
    onSuccess(data) {
      setOpen(false);

      toast(t("TABLE_TOAST_RESTORED", "Table restored!"), {
        className: "!bg-green-600 !text-white !border-green-600",
        description: t(
          "TABLE_TOAST_RESTORED_DESCRIPTION",
          `The table "${data.name}" was restored from trash`
        ),
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
        ["/tables/paginated", { ...search, trashed: false }],
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
            data?.message ?? t("TABLE_ERROR_INVALID_ID", "Invalid table ID")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t(
                "TABLE_ERROR_AUTHENTICATION_REQUIRED",
                "Authentication required"
              )
          );
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ??
              t(
                "TABLE_ERROR_INSUFFICIENT_PERMISSIONS",
                "Insufficient permissions to restore this table"
              )
          );
        }

        // 404 - TABLE_NOT_FOUND
        if (data?.code === 404 && data?.cause === "TABLE_NOT_FOUND") {
          toast.error(
            data?.message ??
              t("TABLE_ERROR_NOT_FOUND_TRASH", "Table not found in trash")
          );
        }

        // 409 - TABLE_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "TABLE_ALREADY_EXISTS") {
          toast.error(
            data?.message ??
              t(
                "TABLE_ERROR_CANNOT_RESTORE",
                "Cannot restore: table with this name already exists"
              )
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500 && data?.cause === "SERVER_ERROR") {
          toast.error(
            data?.message ??
              t("TABLE_ERROR_INTERNAL_SERVER", "Internal server error")
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
            {t("TABLE_DIALOG_RESTORE_TITLE", "Restore table from trash")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "TABLE_DIALOG_RESTORE_DESCRIPTION",
              "By confirming this action, the table will be restored from trash"
            )}
          </DialogDescription>
        </DialogHeader>
        <section>
          <form className="pt-4 pb-2">
            <DialogFooter className="inline-flex w-full gap-2 justify-end">
              <DialogClose asChild>
                <Button className="bg-destructive  hover:bg-destructive">
                  {t("TABLE_DIALOG_CANCEL_BUTTON", "Cancel")}
                </Button>
              </DialogClose>
              <Button
                type="button"
                disabled={RemoveFromTrash.status === "pending"}
                onClick={() => {
                  RemoveFromTrash.mutateAsync();
                }}
              >
                {RemoveFromTrash.status === "pending" && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(RemoveFromTrash.status === "pending") && (
                  <span>{t("TABLE_DIALOG_CONFIRM_BUTTON", "Confirm")}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
