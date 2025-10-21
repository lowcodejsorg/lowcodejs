/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/hooks/i18.hook";
import { cn } from "@/lib/utils";
import { useRouter, useSearch } from "@tanstack/react-router";
import { LayoutDashboardIcon, LayoutListIcon } from "lucide-react";

export function StyleButton() {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  }) as Record<string, any>;

  const router = useRouter();

  return (
    <DropdownMenu dir="ltr" modal={false}>
      <DropdownMenuTrigger asChild>
        <Button className={cn("shadow-none p-1 h-auto")} variant="outline">
          {search?.style === "gallery" && (
            <LayoutDashboardIcon className="w-4 h-4  " />
          )}
          {search?.style === "list" && <LayoutListIcon className="w-4 h-4  " />}
          {t("COLLECTION_DROPDOWN_LAYOUT_LABEL", "Exibição")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-xs">
        <DropdownMenuRadioGroup value={(search.style as string) ?? "list"}>
          <DropdownMenuRadioItem
            value="list"
            className="inline-flex space-x-1 w-full"
            onClick={() => {
              router.navigate({
                // @ts-ignore
                search: (state) => ({
                  ...state,
                  style: "list",
                }),
              });
            }}
          >
            <LayoutListIcon className="w-4 h-4" />
            <span> {t("COLLECTION_LAYOUT_LIST_LABEL", "Lista")}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="inline-flex space-x-1 w-full"
            value="gallery"
            onClick={() => {
              router.navigate({
                // @ts-ignore
                search: (state) => ({
                  ...state,
                  style: "gallery",
                }),
              });
            }}
          >
            <LayoutDashboardIcon className="w-4 h-4" />
            <span> {t("COLLECTION_LAYOUT_GRID_LABEL", "Galeria")}</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
