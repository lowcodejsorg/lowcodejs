/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FIELD_TYPE, type Field } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/i18.hook";
import { RowTableCategory } from "@/routes/_private/tables/$slug/-components/_row/row-table-category";
import { RowTableDate } from "@/routes/_private/tables/$slug/-components/_row/row-table-date";
import { RowTableDropdown } from "@/routes/_private/tables/$slug/-components/_row/row-table-dropdown";
import { RowTableRelationship } from "@/routes/_private/tables/$slug/-components/_row/row-table-relationship";
import { RowTableTextLong } from "@/routes/_private/tables/$slug/-components/_row/row-table-text-long";
import { RowTableTextShort } from "@/routes/_private/tables/$slug/-components/_row/row-table-text-short";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { FilterIcon, XIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { Badge } from "../ui/badge";
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
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const search = useSearch({
    strict: false,
  }) as Record<string, string>;

  const form = useForm();

  const onSubmit = form.handleSubmit((data) => {
    const filters: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      const cleanKey = key.replace(/-final|-initial/g, "");

      if (!value) continue;

      const field = fields.find((f) => f.slug === cleanKey);

      if (!field) continue;

      if ([FIELD_TYPE.TEXT_SHORT, FIELD_TYPE.TEXT_LONG].includes(field.type))
        filters[cleanKey] = String(value);

      if (
        [FIELD_TYPE.DROPDOWN, FIELD_TYPE.CATEGORY].includes(field.type) &&
        Array.from(value).length > 0
      )
        filters[cleanKey] = Array.from<String>(value).join(",");

      if ([FIELD_TYPE.DATE].includes(field.type)) {
        if (
          data[cleanKey.concat("-initial")] &&
          data[cleanKey.concat("-initial")] instanceof Date
        ) {
          filters[cleanKey.concat("-initial")] = format(
            data[cleanKey.concat("-initial")],
            "yyyy-MM-dd"
          );
        }

        if (
          data[cleanKey.concat("-final")] &&
          data[cleanKey.concat("-final")] instanceof Date
        ) {
          filters[cleanKey.concat("-final")] = format(
            data[cleanKey.concat("-final")],
            "yyyy-MM-dd"
          );
        }
      }

      // if([FIELD_TYPE.DATE].includes(field.type))
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

  const activeFiltersCount = fields.filter((f) => {
    const key = f.slug.replace(/-final|-initial/g, "");
    return (
      search[key] ||
      search[key.concat("-initial")] ||
      search[key.concat("-final")]
    );
  }).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          <Button className={cn("shadow-none p-1 h-auto")} variant="outline">
            <FilterIcon className="size-4" />
            <span>{t("FILTER_BUTTON_LABEL", "Filtros")}</span>
          </Button>
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">{t("FILTER_SHEET_TITLE", "Filtros")}</SheetTitle>
          <SheetDescription>
            {t("FILTER_SHEET_DESCRIPTION", "Aplique filtros para a busca de dados")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
            <section className="flex flex-col gap-4 w-full">
              {/* Default is Text Short */}

              {fields?.map((field) => (
                <div
                  key={field.slug}
                  className="inline-flex w-full items-center space-x-1"
                >
                  <div className="flex flex-1 w-full flex-col space-y-4 relative">
                    {field.type === FIELD_TYPE.TEXT_SHORT && (
                      <RowTableTextShort
                        key={field._id}
                        field={field}
                        defaultValue={search[field.slug] ?? undefined}
                        required={false}
                        className="flex-1 w-full"
                      />
                    )}

                    {field.type === FIELD_TYPE.TEXT_LONG && (
                      <RowTableTextLong
                        key={field._id}
                        field={field}
                        defaultValue={search[field.slug] ?? undefined}
                        required={false}
                        className="flex-1 w-full"
                      />
                    )}

                    {field.type === FIELD_TYPE.DROPDOWN && (
                      <RowTableDropdown
                        field={field}
                        key={field._id}
                        isMultiple={field?.configuration?.multiple}
                        defaultValue={search[field.slug]
                          ?.split(",")
                          .map((f) => ({
                            label: f,
                            value: f,
                          }))}
                        required={false}
                      />
                    )}

                    {field.type === FIELD_TYPE.DATE && (
                      <div
                        key={field._id}
                        className="inline-flex w-full space-x-2"
                      >
                        <RowTableDate
                          field={{ ...field, name: `${field.name} ${t("FILTER_DATE_INITIAL_SUFFIX", "Inicial")}` }}
                          name={field.slug?.concat("-initial")}
                          defaultValue={
                            search[field.slug?.concat("-initial")]
                              ? parseISO(search[field.slug?.concat("-initial")])
                              : undefined
                          }
                          required={false}
                        />
                        <RowTableDate
                          field={{ ...field, name: `${field.name} ${t("FILTER_DATE_FINAL_SUFFIX", "Final")}` }}
                          name={field.slug?.concat("-final")}
                          defaultValue={
                            search[field.slug?.concat("-final")]
                              ? parseISO(search[field.slug?.concat("-final")])
                              : undefined
                          }
                          required={false}
                        />
                      </div>
                    )}

                    {FIELD_TYPE.CATEGORY === field.type && (
                      <RowTableCategory
                        key={field._id}
                        field={field}
                        isMultiple={field?.configuration?.multiple}
                        defaultValue={
                          search[field.slug]?.split(",") ?? undefined
                        }
                        required={false}
                      />
                    )}

                    {FIELD_TYPE.RELATIONSHIP === field.type && (
                      <RowTableRelationship
                        field={field}
                        key={field._id}
                        relation={{
                          slug:
                            field?.configuration?.relationship?.table?.slug ||
                            "",
                          field:
                            field?.configuration?.relationship?.field?.slug ||
                            "",
                        }}
                        isMultiple={field?.configuration?.multiple}
                        defaultValue={search[field.slug]
                          .split(",")
                          .map((item: string) => ({
                            value: item,
                            label: `${t("FILTER_RELATIONSHIP_LOADING", "Loading...")} (${item})`,
                          }))}
                        required={false}
                      />
                    )}

                    {[FIELD_TYPE.TEXT_SHORT, FIELD_TYPE.TEXT_LONG].includes(
                      field.type
                    ) &&
                      search[field.slug] && (
                        <Button
                          size="icon-sm"
                          className="cursor-pointer rounded-full size-4 absolute -right-1 top-4"
                          variant="destructive"
                          onClick={() => removeFilter(field.slug)}
                        >
                          <XIcon />
                        </Button>
                      )}
                  </div>
                </div>
              ))}
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
                {t("FILTER_BUTTON_CLEAR", "Limpar")}
              </Button>
              <Button>{t("FILTER_BUTTON_SEARCH", "Pesquisar")}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
