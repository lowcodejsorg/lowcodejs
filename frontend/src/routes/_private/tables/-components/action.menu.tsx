import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthentication } from "@/hooks/authentication.hook";
import { useI18n } from "@/hooks/i18.hook";
import type { Table } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { useRouter, useSearch } from "@tanstack/react-router";
import {
  ArchiveRestoreIcon,
  ArrowRightIcon,
  EllipsisIcon,
  Share2Icon,
  TrashIcon,
} from "lucide-react";
import React from "react";
import { DeleteTable } from "./delete-table.dialog";
import { RemoveTableFromTrash } from "./remove-table-from-trash.dialog";
import { SendTableToTrash } from "./send-table-to-trash.dialog";

interface Props {
  table: Table;
}

export function ActionMenu({ table }: Props) {
  const { t } = useI18n();

  const { verify } = useAuthentication();

  const search = useSearch({
    strict: false,
  }) as Record<string, string>;

  const router = useRouter();

  // const updateTableButtonRef = React.useRef<HTMLButtonElement | null>(
  //   null
  // );

  const sendTableToTrashButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  const RemoveTableFromTrashButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  const removeTableButtonRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <React.Fragment>
      <DropdownMenu dir="ltr" modal={false}>
        <DropdownMenuTrigger className="p-1 rounded-full">
          <EllipsisIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-10">
          <DropdownMenuLabel>{t("ACTION_LABEL", "Ações")}</DropdownMenuLabel>

          <DropdownMenuSeparator />

          {!search?.trashed && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                router.navigate({
                  to: "/tables/".concat(table.slug),
                });
              }}
            >
              <ArrowRightIcon className="size-4" />
              <span>{t("ACTION_INTERNAL_LABEL", "Interna")}</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            className="inline-flex space-x-1 w-full"
            onClick={() => {
              const link = window.location.origin.concat(
                location.pathname.replace(/\/$/, ""),
                "/",
                table.slug
              );

              navigator.clipboard.writeText(link);
            }}
          >
            <Share2Icon className="size-4" />
            <span>{t("ACTION_SHARE_LABEL", "Compartilhar")}</span>
          </DropdownMenuItem>
          {/* {!search?.trashed && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                updateTableButtonRef?.current?.click();
              }}
              disabled={
                !verify({
                  resource: "update-table",
                })
              }
            >
              <PencilIcon className="size-4" />
              <span>{t("ACTION_UPDATE_LABEL", "Editar")}</span>
            </DropdownMenuItem>
          )} */}
          {!search?.trashed && (
            <DropdownMenuItem
              className={cn(
                "inline-flex space-x-1 w-full",
                !verify({
                  resource: "remove-row",
                  owner: table?.configuration?.owner?._id,
                  administrators: table?.configuration?.administrators?.flatMap(
                    (a) => a._id?.toString()
                  ),
                }) && "hidden"
              )}
              onClick={() => {
                sendTableToTrashButtonRef?.current?.click();
              }}
            >
              <TrashIcon className="size-4" />
              <span>{t("ACTION_DELETE_LABEL", "Remover")}</span>
            </DropdownMenuItem>
          )}
          {search?.trashed && (
            <DropdownMenuItem
              className={cn(
                "inline-flex space-x-1 w-full",
                !verify({
                  resource: "remove-row",
                  owner: table?.configuration?.owner?._id,
                  administrators: table?.configuration?.administrators?.flatMap(
                    (a) => a._id?.toString()
                  ),
                }) && "hidden"
              )}
              onClick={() => {
                RemoveTableFromTrashButtonRef?.current?.click();
              }}
            >
              <ArchiveRestoreIcon className="size-4" />
              <span>{t("ACTION_RESTORE_LABEL", "Restaurar")}</span>
            </DropdownMenuItem>
          )}
          {search?.trashed && (
            <DropdownMenuItem
              className={cn(
                "inline-flex space-x-1 w-full",
                !verify({
                  resource: "remove-row",
                  owner: table?.configuration?.owner?._id,
                  administrators: table?.configuration?.administrators?.flatMap(
                    (a) => a._id?.toString()
                  ),
                }) && "hidden"
              )}
              onClick={() => {
                removeTableButtonRef?.current?.click();
              }}
            >
              <TrashIcon className="size-4" />
              <span>{t("ACTION_DELETE_LABEL", "Excluir")}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* <UpdateTableSheet
        slug={table.slug}
        ref={updateTableButtonRef}
      /> */}

      <SendTableToTrash slug={table.slug} ref={sendTableToTrashButtonRef} />

      <RemoveTableFromTrash
        slug={table.slug}
        ref={RemoveTableFromTrashButtonRef}
      />

      <DeleteTable slug={table.slug} ref={removeTableButtonRef} />
    </React.Fragment>
  );
}
