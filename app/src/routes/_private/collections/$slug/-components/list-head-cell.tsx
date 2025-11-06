import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableHead } from "@/components/ui/table";
import { useI18n } from "@/hooks/i18.hook";
import type { Field } from "@/lib/entity";
import { useRouter, useSearch } from "@tanstack/react-router";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsLeftRightIcon,
} from "lucide-react";
import React from "react";
import { FieldCollectionUpdateSheet } from "./field-collection-update-sheet";

interface Props {
  field: Field;
}

export function ListHeadCell({ field }: Props) {
  const { t } = useI18n();
  const search = useSearch({
    strict: false,
  });
  const router = useRouter();

  const updateCollectionFieldButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  const orderKey = `order-${field.slug}`;

  return (
    <TableHead key={field._id} className="w-auto">
      <div className="inline-flex items-center">
        <Button
          className="cursor-pointer h-auto px-2 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent"
          variant="link"
          onClick={() => {
            updateCollectionFieldButtonRef?.current?.click();
          }}
        >
          {field.name}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-auto px-1 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent"
              variant="outline"
            >
              {
                // @ts-ignore
                search[orderKey] === "asc" && (
                  <ArrowUpIcon className="size-4" />
                )
              }
              {
                // @ts-ignore
                search[orderKey] === "desc" && (
                  <ArrowDownIcon className="size-4" />
                )
              }
              {
                // @ts-ignore
                !search[orderKey] && (
                  <ChevronsLeftRightIcon className="size-4 rotate-90" />
                )
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                router.navigate({
                  // @ts-ignore
                  search: (state) => ({
                    ...state,
                    [orderKey]: "asc",
                  }),
                });
              }}
            >
              <ArrowUpIcon />
              {t("COLLECTION_SORT_ASCENDING", "Ascending")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                router.navigate({
                  // @ts-ignore
                  search: (state) => ({
                    ...state,
                    [orderKey]: "desc",
                  }),
                });
              }}
            >
              <ArrowDownIcon /> {t("COLLECTION_SORT_DESCENDING", "Descending")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <FieldCollectionUpdateSheet
        _id={field._id}
        ref={updateCollectionFieldButtonRef}
      />
    </TableHead>
  );
}
