/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/hooks/i18.hook";
import type { Collection } from "@/lib/entity";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsLeftRightIcon,
  CopyIcon,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { ActionMenu } from "./action.menu";

interface Props {
  data: Collection[];
  headers: string[];
}

export function ListStyle({ data, headers }: Props): React.ReactElement {
  const { t } = useI18n();
  const search = useSearch({
    strict: false,
  });

  const router = useRouter();

  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          {headers.map((head) => (
            <TableHead key={head}>
              <div className="inline-flex items-center">
                <span>{head}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="h-auto px-1 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent"
                      variant="outline"
                    >
                      {
                        // @ts-ignore
                        search[`order-${head}`] === "asc" && (
                          <ArrowUpIcon className="size-4" />
                        )
                      }
                      {
                        // @ts-ignore
                        search[`order-${head}`] === "desc" && (
                          <ArrowDownIcon className="size-4" />
                        )
                      }
                      {
                        // @ts-ignore
                        !search[`order-${head}`] && (
                          <ChevronsLeftRightIcon className="size-4 rotate-90" />
                        )
                      }
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        const order_slug = "order-".concat(head?.toLowerCase());

                        router.navigate({
                          // @ts-ignore
                          search: (state) => ({
                            ...state,
                            [order_slug]: "asc",
                          }),
                        });
                      }}
                    >
                      <ArrowUpIcon />
                      {t("COLLECTION_SORT_ASCENDING", "Ascending")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const order_slug = "order-".concat(head?.toLowerCase());

                        router.navigate({
                          // @ts-ignore
                          search: (state) => ({
                            ...state,
                            [order_slug]: "desc",
                          }),
                        });
                      }}
                    >
                      <ArrowDownIcon /> {t("COLLECTION_SORT_DESCENDING", "Descending")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableHead>
          ))}

          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((collection) => (
          <TableRow key={collection._id}>
            <TableCell className="font-medium">
              {collection.name || "N/A"}
            </TableCell>
            <TableCell>
              {collection?.configuration?.style?.toUpperCase() || "N/A"}
            </TableCell>
            <TableCell>
              <div className="inline-flex items-center space-x-2">
                <Link
                  to="/collections/$slug"
                  params={{ slug: collection?.slug }}
                  className="underline underline-offset-4 opacity-70 font-medium"
                >
                  {"/".concat(collection?.slug)}
                </Link>
                <Button
                  className="cursor-copy size-8"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const link = window.location.origin.concat(
                      location.pathname.replace(/\/$/, ""),
                      "/",
                      collection.slug
                    );

                    navigator.clipboard.writeText(link);

                    toast(t("COLLECTION_TOAST_LINK_COPIED", "Link copied"), {
                      className:
                        "!bg-primary !text-primary-foreground !border-primary",
                      description: t("COLLECTION_TOAST_LINK_COPIED_DESCRIPTION", "The link was copied successfully"),
                      descriptionClassName: "!text-primary-foreground",
                      closeButton: true,
                    });
                  }}
                >
                  <CopyIcon className="size-4" />
                </Button>
              </div>
            </TableCell>

            <TableCell className="w-[80px]">
              <ActionMenu collection={collection} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
