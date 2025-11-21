import { FIELD_TYPE, type Field } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { RowTableTextShort } from "@/routes/_private/tables/$slug/-components/_row/row-table-text-short";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { FilterIcon, XIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

interface SheetFilterProps {
  fields: Field[];
}
export function SheetFilter({ fields }: SheetFilterProps) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const search = useSearch({
    strict: false,
  }) as Record<string, string>;

  const form = useForm();

  const onSubmit = form.handleSubmit((data) => {
    const filters: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      if (!value) continue;

      const field = fields.find((f) => f.slug === key);

      if (!field) continue;

      if ([FIELD_TYPE.TEXT_SHORT, FIELD_TYPE.TEXT_LONG].includes(field.type))
        filters[key] = String(value);
    }

    if (Object.keys(filters).length > 0) {
      navigate({
        // @ts-ignore
        search: (state) => ({
          ...state,
          ...filters,
          page: 1,
        }),
      });
    }

    setOpen(false);
  });

  function removeFilter(key: string) {
    navigate({
      // @ts-ignore
      search: (state) => ({
        ...state,
        [key]: undefined,
        page: 1,
      }),
    });

    form.setValue(key, "");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          <Button className={cn("shadow-none p-1 h-auto")} variant="outline">
            <FilterIcon className="size-4" />
            <span>Filtros</span>
          </Button>
          {/* {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full"
            >
              {activeFiltersCount}
            </Badge>
          )} */}
        </div>
      </SheetTrigger>
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">Filtros</SheetTitle>
          <SheetDescription>
            Aplique filtros para a busca de dados
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
            <section className="flex flex-col gap-4 w-full">
              {/* Default is Text Short */}

              {fields?.map((field) => {
                return (
                  <div
                    className="inline-flex w-full items-center space-x-1 relative"
                    key={field.slug}
                  >
                    <RowTableTextShort
                      key={field._id}
                      field={field}
                      defaultValue={search[field.slug] ?? undefined}
                      required={false}
                      className="flex-1 w-full"
                    />

                    {search[field.slug] && (
                      <Button
                        size="icon-sm"
                        className="cursor-pointer rounded-full size-4 absolute right-0"
                        variant="destructive"
                        onClick={() => removeFilter(field.slug)}
                      >
                        <XIcon />
                      </Button>
                    )}
                  </div>
                );
              })}
            </section>

            <SheetFooter className="flex-row w-full justify-end gap-4 px-0">
              <Button
                onClick={() => {
                  navigate({
                    // @ts-ignore
                    search: (state) => ({
                      page: 1,
                      perPage: state.perPage,
                      trashed: state.trashed,
                    }),
                  });
                  setOpen(false);
                }}
                type="button"
                className="shadow-none border bg-transparent border-destructive text-destructive hover:bg-destructive/20"
              >
                Limpar
              </Button>
              <Button>Pesquisar</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
