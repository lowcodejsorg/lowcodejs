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
import type { Collection } from "@/lib/entity";
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
import { DeleteCollection } from "./delete-collection.dialog";
import { RemoveCollectionFromTrash } from "./remove-collection-from-trash.dialog";
import { SendCollectionToTrash } from "./send-collection-to-trash.dialog";

interface Props {
  collection: Collection;
}

export function ActionMenu({ collection }: Props) {
  const { t } = useI18n();

  const { verify } = useAuthentication();

  const search = useSearch({
    strict: false,
  }) as Record<string, string>;

  const router = useRouter();

  // const updateCollectionButtonRef = React.useRef<HTMLButtonElement | null>(
  //   null
  // );

  const sendCollectionToTrashButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  const RemoveCollectionFromTrashButtonRef =
    React.useRef<HTMLButtonElement | null>(null);

  const removeCollectionButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

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
                  to: "/collections/".concat(collection.slug),
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
                collection.slug
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
                updateCollectionButtonRef?.current?.click();
              }}
              disabled={
                !verify({
                  resource: "update-collection",
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
                  owner: collection?.configuration?.owner?._id,
                  administrators:
                    collection?.configuration?.administrators?.flatMap((a) =>
                      a._id?.toString()
                    ),
                }) && "hidden"
              )}
              onClick={() => {
                sendCollectionToTrashButtonRef?.current?.click();
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
                  owner: collection?.configuration?.owner?._id,
                  administrators:
                    collection?.configuration?.administrators?.flatMap((a) =>
                      a._id?.toString()
                    ),
                }) && "hidden"
              )}
              onClick={() => {
                RemoveCollectionFromTrashButtonRef?.current?.click();
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
                  owner: collection?.configuration?.owner?._id,
                  administrators:
                    collection?.configuration?.administrators?.flatMap((a) =>
                      a._id?.toString()
                    ),
                }) && "hidden"
              )}
              onClick={() => {
                removeCollectionButtonRef?.current?.click();
              }}
            >
              <TrashIcon className="size-4" />
              <span>{t("ACTION_DELETE_LABEL", "Excluir")}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* <UpdateCollectionSheet
        slug={collection.slug}
        ref={updateCollectionButtonRef}
      /> */}

      <SendCollectionToTrash
        slug={collection.slug}
        ref={sendCollectionToTrashButtonRef}
      />

      <RemoveCollectionFromTrash
        slug={collection.slug}
        ref={RemoveCollectionFromTrashButtonRef}
      />

      <DeleteCollection
        slug={collection.slug}
        ref={removeCollectionButtonRef}
      />
    </React.Fragment>
  );
}
