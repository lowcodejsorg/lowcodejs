/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import { FieldTableUpdateSheet } from "./field-table-update-sheet";

interface Props {
  field: Field;
}

export function ListHeadCell({ field }: Props) {
  const { t } = useI18n();
  const search = useSearch({
    strict: false,
  });
  const router = useRouter();

  const updateTableFieldButtonRef = React.useRef<HTMLButtonElement | null>(
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
            updateTableFieldButtonRef?.current?.click();
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
              {search[orderKey] === "asc" && <ArrowUpIcon className="size-4" />}
              {search[orderKey] === "desc" && (
                <ArrowDownIcon className="size-4" />
              )}
              {!search[orderKey] && (
                <ChevronsLeftRightIcon className="size-4 rotate-90" />
              )}
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
              {t("TABLE_SORT_ASCENDING", "Ascending")}
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
              <ArrowDownIcon /> {t("TABLE_SORT_DESCENDING", "Descending")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <FieldTableUpdateSheet _id={field._id} ref={updateTableFieldButtonRef} />
    </TableHead>
  );
}
