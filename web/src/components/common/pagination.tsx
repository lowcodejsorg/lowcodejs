/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Button } from "@/components/ui/button";
import { PaginationContent, PaginationItem } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/hooks/i18.hook";
import type { Meta } from "@/lib/entity";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface Props {
  meta: Meta;
}

export function Pagination({ meta }: Props) {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  const navigate = useNavigate();

  const page = Number((search.page || meta?.page) ?? 1);
  const perPage = Number((search.perPage || meta?.perPage) ?? 50);
  const lastPage = Number(meta?.lastPage ?? 1);

  return (
    <section className="flex flex-col lg:flex-row w-full justify-between flex-shrink-0 gap-2">
      <div className="inline-flex gap-2 items-center ">
        <span className="inline-flex flex-1">
          {t("PAGINATION_PER_PAGE_LABEL", "Itens por página")}:{" "}
        </span>
        <Select
          defaultValue={String(perPage ?? 50)}
          onValueChange={(value) => {
            navigate({
              // @ts-ignore
              search: (state) => ({
                ...state,
                perPage: Number(value),
              }),
            });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="inline-flex space-x-8 items-center">
        <label className="inline-flex flex-1 gap-1">
          {t("PAGINATION_PAGE_LABEL", "Página")} <strong>{page}</strong>{" "}
          {lastPage > 1 && (
            <>
              /<strong>{lastPage}</strong>
            </>
          )}
        </label>
        <PaginationContent className="justify-between w-[180px] ">
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              className="border"
              disabled={page === 1}
              onClick={() => {
                navigate({
                  // @ts-ignore
                  search: (state) => ({
                    ...state,
                    page: 1,
                  }),
                });
              }}
            >
              <ChevronsLeft />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              className="border"
              disabled={page === 1}
              onClick={() => {
                navigate({
                  // @ts-ignore
                  search: (state) => ({
                    ...state,
                    page: Number(state.page) - 1,
                  }),
                });
              }}
            >
              <ChevronLeft />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              className="border"
              disabled={page === lastPage}
              onClick={() => {
                navigate({
                  // @ts-ignore
                  search: (state) => ({
                    ...state,
                    page: Number(state.page) + 1,
                  }),
                });
              }}
            >
              <ChevronRight />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              className="border"
              disabled={page === lastPage}
              onClick={() => {
                navigate({
                  // @ts-ignore
                  search: (state) => ({
                    ...state,
                    page: lastPage,
                  }),
                });
              }}
            >
              <ChevronsRight />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </div>
    </section>
  );
}
