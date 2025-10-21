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
import type { Collection, Paginated } from "@/lib/entity";
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

export function RemoveCollectionFromTrash({
  slug,
  ...props
}: RemoveFromTrashProps) {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  const [open, setOpen] = React.useState(false);

  const RemoveFromTrash = useMutation({
    mutationFn: async function () {
      const route = "/collections/".concat(slug).concat("/restore");
      const response = await API.patch<Collection>(route);
      return response.data;
    },
    onSuccess(data) {
      setOpen(false);

      toast(t("COLLECTION_TOAST_RESTORED", "Collection restored!"), {
        className: "!bg-green-600 !text-white !border-green-600",
        description: t("COLLECTION_TOAST_RESTORED_DESCRIPTION", `The collection "${data.name}" was restored from trash`),
        descriptionClassName: "!text-white",
        closeButton: true,
      });

      QueryClient.setQueryData<Paginated<Collection[]>>(
        ["/collections/paginated", { ...search }],
        (old) => {
          if (!old) return old;
          return {
            meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
            data: old.data.filter((item) => item.slug !== slug),
          };
        }
      );

      QueryClient.setQueryData<Paginated<Collection[]>>(
        ["/collections/paginated", { ...search, trashed: false }],
        (old) => {
          if (!old) return old;
          return {
            meta: { ...old.meta, total: old.meta.total + 1 },
            data: [data, ...old.data],
          };
        }
      );

      QueryClient.setQueryData<Collection>(
        ["/collections/".concat(data.slug), data.slug],
        data
      );
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(data?.message ?? t("COLLECTION_ERROR_INVALID_ID", "Invalid collection ID"));
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? t("COLLECTION_ERROR_AUTHENTICATION_REQUIRED", "Authentication required"));
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ??
              t("COLLECTION_ERROR_INSUFFICIENT_PERMISSIONS", "Insufficient permissions to restore this collection")
          );
        }

        // 404 - COLLECTION_NOT_FOUND
        if (data?.code === 404 && data?.cause === "COLLECTION_NOT_FOUND") {
          toast.error(data?.message ?? t("COLLECTION_ERROR_NOT_FOUND_TRASH", "Collection not found in trash"));
        }

        // 409 - COLLECTION_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "COLLECTION_ALREADY_EXISTS") {
          toast.error(
            data?.message ??
              t("COLLECTION_ERROR_CANNOT_RESTORE", "Cannot restore: collection with this name already exists")
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500 && data?.cause === "SERVER_ERROR") {
          toast.error(data?.message ?? t("COLLECTION_ERROR_INTERNAL_SERVER", "Internal server error"));
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
              "COLLECTION_DIALOG_RESTORE_TITLE",
              "Restore collection from trash"
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "COLLECTION_DIALOG_RESTORE_DESCRIPTION",
              "By confirming this action, the collection will be restored from trash"
            )}
          </DialogDescription>
        </DialogHeader>
        <section>
          <form className="pt-4 pb-2">
            <DialogFooter className="inline-flex w-full gap-2 justify-end">
              <DialogClose asChild>
                <Button className="bg-destructive  hover:bg-destructive">
                  {t(
                    "COLLECTION_DIALOG_CANCEL_BUTTON",
                    "Cancel"
                  )}
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
                  <span>
                    {t(
                      "COLLECTION_DIALOG_CONFIRM_BUTTON",
                      "Confirm"
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
