/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/hooks/authentication.hook";
import { useI18n } from "@/hooks/i18.hook";
import { cn } from "@/lib/utils";
import { useRouter, useSearch } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
import React from "react";

export function TrashButton() {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  }) as Record<string, any>;

  const router = useRouter();

  const { verify } = useAuthentication();

  return (
    <Button
      onClick={() => {
        if (!search.trashed) {
          router.navigate({
            // @ts-ignore
            search: (state) => ({
              ...state,
              trashed: true,
              page: 1,
              perPage: 50,
            }),
          });
          return;
        }

        router.navigate({
          // @ts-ignore
          search: (state) => ({
            ...state,
            trashed: false,
            page: 1,
            perPage: 50,
          }),
        });
      }}
      className={cn(
        "py-1 px-2 h-auto inline-flex gap-1",
        !verify({
          resource: "view-row",
        }) && "hidden",
        search.trashed && "border border-muted-foreground "
      )}
      variant="outline"
    >
      {!search.trashed && (
        <React.Fragment>
          <LogOutIcon className="size-4" />
          <span>{t("TABLE_TRASH_VIEW_LABEL", "View trash")}</span>
        </React.Fragment>
      )}
      {search.trashed && (
        <React.Fragment>
          <LogOutIcon className="size-4 rotate-180" />
          <span>{t("TABLE_TRASH_EXIT_LABEL", "Exit trash")}</span>
        </React.Fragment>
      )}

      {/* <span>{t("TABLE_BUTTON_TRASH_LABEL", "Lixeira")}</span> */}
    </Button>
  );
}
