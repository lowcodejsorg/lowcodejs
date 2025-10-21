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
import { API } from "@/lib/api";
import type { Collection, Row } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import {
  ArchiveRestoreIcon,
  EllipsisIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import React from "react";
import { RowCollectionShowSheet } from "./row-collection-show-sheet";
import { RowCollectionUpdateSheet } from "./row-collection-update-sheet";
import { RowDeleteDialog } from "./row-delete-dialog";
import { RowRemoveFromTrashDialog } from "./row-remove-from-trash-dialog";
import { RowSendToTrashDialog } from "./row-send-to-trash-dialog";

export function ActionMenu({ row }: { row: Row }) {
  const { verify } = useAuthentication();
  const { t } = useI18n();

  const { slug } = useParams({
    from: "/_private/collections/$slug/",
  });

  const search = useSearch({
    from: "/_private/collections/$slug/",
  });

  const collection = useQuery({
    queryKey: ["/collections/".concat(slug), slug],
    queryFn: async () => {
      const route = "/collections/".concat(slug);
      const response = await API.get<Collection>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const showRowCollectionButtonRef = React.useRef<HTMLButtonElement>(null);
  const updateRowCollectionButtonRef = React.useRef<HTMLButtonElement>(null);
  const sendRowToTrashButtonRef = React.useRef<HTMLButtonElement>(null);
  const removeRowFromTrashButtonRef = React.useRef<HTMLButtonElement>(null);
  const deleteRowButtonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <React.Fragment>
      <DropdownMenu dir="ltr" modal={false}>
        <DropdownMenuTrigger className="p-1 rounded-full ">
          <EllipsisIcon className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-10">
          <DropdownMenuLabel>{t("ACTION_LABEL", "Ações")}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="inline-flex space-x-1 w-full"
            onClick={() => {
              showRowCollectionButtonRef?.current?.click();
            }}
          >
            <EyeIcon className="w-4 h-4" />
            <span>{t("ACTION_SHOW_LABEL", "Visualizar")}</span>
          </DropdownMenuItem>

          {
            // !paginaPublica &&
            !search?.trashed && collection?.data?.type === "collection" && (
              <DropdownMenuItem
                className={cn(
                  "inline-flex space-x-1 w-full",
                  !verify({
                    resource: "create-row",
                    owner: collection?.data?.configuration?.owner?._id,
                    administrators:
                      collection?.data?.configuration?.administrators?.flatMap(
                        (a) => a._id?.toString()
                      ),
                  }) && "hidden"
                )}
                onClick={() => {
                  updateRowCollectionButtonRef?.current?.click();
                }}
              >
                <PencilIcon className="w-4 h-4" />
                <span>{t("ACTION_UPDATE_LABEL", "Editar")}</span>
              </DropdownMenuItem>
            )
          }

          {
            // !paginaPublica &&
            !search?.trashed && collection?.data?.type === "collection" && (
              <DropdownMenuItem
                className={cn(
                  "inline-flex space-x-1 w-full",
                  !verify({
                    resource: "create-row",
                    owner: collection?.data?.configuration?.owner?._id,
                    administrators:
                      collection?.data?.configuration?.administrators?.flatMap(
                        (a) => a._id?.toString()
                      ),
                  }) && "hidden"
                )}
                onClick={() => {
                  sendRowToTrashButtonRef?.current?.click();
                }}
              >
                <TrashIcon className="w-4 h-4" />
                <span>{t("ACTION_DELETE_LABEL", "Remover")}</span>
              </DropdownMenuItem>
            )
          }
          {
            // !paginaPublica &&
            search?.trashed && collection?.data?.type === "collection" && (
              <DropdownMenuItem
                className={cn(
                  "inline-flex space-x-1 w-full",
                  !verify({
                    resource: "create-row",
                    owner: collection?.data?.configuration?.owner?._id,
                    administrators:
                      collection?.data?.configuration?.administrators?.flatMap(
                        (a) => a._id?.toString()
                      ),
                  }) && "hidden"
                )}
                onClick={() => {
                  removeRowFromTrashButtonRef?.current?.click();
                }}
              >
                <ArchiveRestoreIcon className="w-4 h-4" />
                <span>{t("ACTION_RESTORE_LABEL", "Restaurar")}</span>
              </DropdownMenuItem>
            )
          }

          {
            // !paginaPublica &&
            search?.trashed && collection?.data?.type === "collection" && (
              <DropdownMenuItem
                className={cn(
                  "inline-flex space-x-1 w-full",
                  !verify({
                    resource: "create-row",
                    owner: collection?.data?.configuration?.owner?._id,
                    administrators:
                      collection?.data?.configuration?.administrators?.flatMap(
                        (a) => a._id?.toString()
                      ),
                  }) && "hidden"
                )}
                onClick={() => {
                  deleteRowButtonRef?.current?.click();
                }}
              >
                <TrashIcon className="w-4 h-4" />
                <span>{t("ACTION_DELETE_LABEL", "Excluir")}</span>
              </DropdownMenuItem>
            )
          }
        </DropdownMenuContent>

        <RowCollectionShowSheet
          _id={row._id}
          ref={showRowCollectionButtonRef}
        />

        <RowCollectionUpdateSheet
          _id={row._id}
          ref={updateRowCollectionButtonRef}
        />

        <RowSendToTrashDialog rowId={row._id} ref={sendRowToTrashButtonRef} />

        <RowRemoveFromTrashDialog
          rowId={row._id}
          ref={removeRowFromTrashButtonRef}
        />

        <RowDeleteDialog rowId={row._id} ref={deleteRowButtonRef} />
      </DropdownMenu>
    </React.Fragment>
  );
}
