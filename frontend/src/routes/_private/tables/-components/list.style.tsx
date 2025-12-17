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
import type { Table as Model } from "@/lib/entity";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  data: Model[];
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
          {headers.map((head) => {
            const order_slug = "order-".concat(
              head?.toLowerCase()?.split(" ")?.join("-")
            );

            return (
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
                          search[order_slug] === "asc" && (
                            <ArrowUpIcon className="size-4" />
                          )
                        }
                        {
                          // @ts-ignore
                          search[order_slug] === "desc" && (
                            <ArrowDownIcon className="size-4" />
                          )
                        }
                        {
                          // @ts-ignore
                          !search[order_slug] && (
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
                              [order_slug]: "asc",
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
                              [order_slug]: "desc",
                            }),
                          });
                        }}
                      >
                        <ArrowDownIcon />{" "}
                        {t("TABLE_SORT_DESCENDING", "Descending")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>
            );
          })}

          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((table) => (
          <TableRow key={table._id}>
            <TableCell className="font-medium">{table.name || "N/A"}</TableCell>
            <TableCell>
              <div className="inline-flex items-center space-x-2">
                <Link
                  to="/tables/$slug"
                  params={{ slug: table?.slug }}
                  className="underline underline-offset-4 opacity-70 font-medium"
                >
                  {"/".concat(table?.slug)}
                </Link>
                <Button
                  className="cursor-copy size-8"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const link = window.location.origin.concat(
                      location.pathname.replace(/\/$/, ""),
                      "/",
                      table.slug
                    );

                    navigator.clipboard.writeText(link);

                    toast(t("TABLE_TOAST_LINK_COPIED", "Link copied"), {
                      className:
                        "!bg-primary !text-primary-foreground !border-primary",
                      description: t(
                        "TABLE_TOAST_LINK_COPIED_DESCRIPTION",
                        "The link was copied successfully"
                      ),
                      descriptionClassName: "!text-primary-foreground",
                      closeButton: true,
                    });
                  }}
                >
                  <CopyIcon className="size-4" />
                </Button>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {table.createdAt
                ? format(new Date(table.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })
                : "N/A"}
            </TableCell>

            <TableCell className="w-[80px]">
              <ActionMenu table={table} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
