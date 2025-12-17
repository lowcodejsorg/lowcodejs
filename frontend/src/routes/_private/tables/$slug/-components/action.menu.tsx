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
import type { Row, Table } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import {
  ArchiveRestoreIcon,
  EllipsisIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import React from "react";
import { RowDeleteDialog } from "./row-delete-dialog";
import { RowRemoveFromTrashDialog } from "./row-remove-from-trash-dialog";
import { RowSendToTrashDialog } from "./row-send-to-trash-dialog";
import { RowTableUpdateSheet } from "./row-table-update-sheet";

export function ActionMenu({ row }: { row: Row }) {
  const { verify } = useAuthentication();
  const { t } = useI18n();

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const search = useSearch({
    from: "/_private/tables/$slug/",
  });

  const table = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const updateRowTableButtonRef = React.useRef<HTMLButtonElement>(null);
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
            // onClick={() => {
            //   showRowTableButtonRef?.current?.click();
            // }}
            asChild
          >
            <Link
              to="/tables/$slug/rows/$rowId"
              params={{ rowId: row._id, slug }}
            >
              <EyeIcon className="w-4 h-4" />
              <span>{t("ACTION_SHOW_LABEL", "Visualizar")}</span>
            </Link>
          </DropdownMenuItem>

          {
            // !paginaPublica &&
            !search?.trashed && table?.data?.type === "table" && (
              <DropdownMenuItem
                className={cn(
                  "inline-flex space-x-1 w-full",
                  !verify({
                    resource: "create-row",
                    owner: table?.data?.configuration?.owner?._id,
                    administrators:
                      table?.data?.configuration?.administrators?.flatMap((a) =>
                        a._id?.toString()
                      ),
                  }) && "hidden"
                )}
                onClick={() => {
                  updateRowTableButtonRef?.current?.click();
                }}
              >
                <PencilIcon className="w-4 h-4" />
                <span>{t("ACTION_UPDATE_LABEL", "Editar")}</span>
              </DropdownMenuItem>
            )
          }

          {
            // !paginaPublica &&
            !search?.trashed && table?.data?.type === "table" && (
              <DropdownMenuItem
                className={cn(
                  "inline-flex space-x-1 w-full",
                  !verify({
                    resource: "create-row",
                    owner: table?.data?.configuration?.owner?._id,
                    administrators:
                      table?.data?.configuration?.administrators?.flatMap((a) =>
                        a._id?.toString()
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
            search?.trashed && table?.data?.type === "table" && (
              <DropdownMenuItem
                className={cn(
                  "inline-flex space-x-1 w-full",
                  !verify({
                    resource: "create-row",
                    owner: table?.data?.configuration?.owner?._id,
                    administrators:
                      table?.data?.configuration?.administrators?.flatMap((a) =>
                        a._id?.toString()
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
            search?.trashed && table?.data?.type === "table" && (
              <DropdownMenuItem
                className={cn(
                  "inline-flex space-x-1 w-full",
                  !verify({
                    resource: "create-row",
                    owner: table?.data?.configuration?.owner?._id,
                    administrators:
                      table?.data?.configuration?.administrators?.flatMap((a) =>
                        a._id?.toString()
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

        <RowTableUpdateSheet _id={row._id} ref={updateRowTableButtonRef} />

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
