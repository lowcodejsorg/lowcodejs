/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/hooks/i18.hook";
import { FilterIcon } from "lucide-react";
import React from "react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as Root,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SheetFooter } from "@/components/ui/sheet";
import { useRouter, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

interface Props {
  onClose: () => void;
}

export function FilterTableForm({ onClose }: Props) {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  const router = useRouter();

  const form = useForm();

  const [debounceTimer, setDebounceTimer] =
    React.useState<NodeJS.Timeout | null>(null);

  const handleFieldChange = React.useCallback(
    (value: string) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        if (value.trim() === "") {
          router.navigate({
            // @ts-ignore
            search: (state) => ({
              ...state,
              name: undefined,
              page: 1,
              perPage: 50,
            }),
          });
        }
      }, 300);

      setDebounceTimer(timer);
    },
    [router, debounceTimer]
  );

  React.useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const onSubmit = form.handleSubmit((data) => {
    if (data["name"]) {
      router.navigate({
        // @ts-ignore
        search: (state) => ({
          ...state,
          name: data["name"],
        }),
      });
    }

    router.navigate({
      // @ts-ignore
      search: (state) => ({
        ...state,
        page: 1,
        perPage: 50,
      }),
    });

    onClose();
  });

  return (
    <Root {...form}>
      <form
        className="flex flex-col gap-4 h-auto px-0 rounded-xl"
        onSubmit={onSubmit}
      >
        <FormField
          control={form.control}
          name={"name"}
          defaultValue={search.name ?? ""}
          render={({ field: { onChange, ...field } }) => {
            return (
              <FormItem className="space-y-1">
                <FormLabel className="data-[error=true]:text-destructive">
                  {t("TABLE_SHEET_FIELD_NAME_LABEL", "Nome")}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      t(
                        "TABLE_SHEET_FIELD_NAME_PLACEHOLDER",
                        t("TABLE_FILTER_TABLE_NAME", "Table name")
                      ) as string
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      onChange(value);
                      handleFieldChange(value);
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-right text-destructive" />
              </FormItem>
            );
          }}
        />

        <SheetFooter className="flex-row w-full justify-end gap-4 px-0">
          <Button
            onClick={function () {
              router.navigate({
                // @ts-ignore
                search: (state) => ({
                  ...state,
                  page: 1,
                  perPage: 50,
                  name: undefined,
                }),
              });
              onClose();
            }}
            type="button"
            className="shadow-none border bg-transparent border-destructive text-destructive hover:bg-destructive/20"
          >
            {t("BUTTON_CLEAR_LABEL", "Limpar")}
          </Button>
          <Button>{t("BUTTON_SEARCH_LABEL", "Pesquisar")}</Button>
        </SheetFooter>
      </form>
    </Root>
  );
}

export function FilterTableSheet() {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet modal open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="py-1 px-2 h-auto inline-flex gap-1"
          variant="outline"
        >
          <FilterIcon className="w-5 h-5" />
          <span>{t("TABLE_BUTTON_FILTER_LABEL", "Filtro")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t("TABLE_ROUTE_SHEET_FILTER_TITLE", "Filtros")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "TABLE_ROUTE_SHEET_FILTER_DESCRIPTION",
              "Aplique filtros para a busca de listas"
            )}
          </SheetDescription>
        </SheetHeader>

        <FilterTableForm onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
