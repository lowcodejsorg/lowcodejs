/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Sheet as Root,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import { FIELD_TYPE, type Field, type Table } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { parseISO } from "date-fns";
import { FilterIcon, XIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { RowTableCategory } from "./_row/row-table-category";
import { RowTableDate } from "./_row/row-table-date";
import { RowTableDropdown } from "./_row/row-table-dropdown";
import { RowTableRelationship } from "./_row/row-table-relationship";
import { RowTableTextLong } from "./_row/row-table-text-long";
import { RowTableTextShort } from "./_row/row-table-text-short";

interface Props {
  onClose: () => void;
}

function FieldGroupFilters({ field }: { field: Field }) {
  const search = useSearch({
    // from: "/_private/tables/$slug/",
    strict: false,
  });

  const table = useQuery({
    queryKey: [
      "/tables/".concat(field.configuration.group?.slug || ""),
      field.configuration.group?.slug,
    ],
    queryFn: async () => {
      const route = "/tables/".concat(field.configuration.group?.slug || "");
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(field.configuration.group?.slug),
  });

  const getFieldGroupDefaultValue = (subField: Field): any => {
    const fieldName = `${field.slug}-${subField.slug}`;
    const paramValue = search[fieldName as keyof typeof search] as string;

    if (!paramValue) return undefined;

    if (
      subField.type === FIELD_TYPE.TEXT_SHORT ||
      subField.type === FIELD_TYPE.TEXT_LONG
    ) {
      return paramValue;
    }

    if (
      [
        FIELD_TYPE.DROPDOWN,
        FIELD_TYPE.RELATIONSHIP,
        FIELD_TYPE.CATEGORY,
      ].includes(subField.type)
    ) {
      return paramValue
        .split(",")
        .map((item: string) => ({ value: item, label: item }));
    }

    if (subField.type === FIELD_TYPE.DATE) {
      return paramValue ? parseISO(paramValue) : undefined;
    }

    return paramValue;
  };

  const getFieldGroupDateDefaultValue = (
    subField: Field,
    suffix: string
  ): Date | undefined => {
    const fieldName = `${field.slug}-${subField.slug}-${suffix}`;
    const paramValue = search[fieldName as keyof typeof search] as string;
    return paramValue ? parseISO(paramValue) : undefined;
  };

  if (!table.data?.fields) return null;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">
        {field.name}
      </h4>
      {table.data.fields
        .filter((subField) => subField?.configuration?.filtering)
        .map((subField) => {
          const fieldName = `${field.slug}-${subField.slug}`;

          if (subField?.type === FIELD_TYPE.TEXT_SHORT) {
            return (
              <RowTableTextShort
                key={subField._id}
                field={{
                  ...subField,
                  name: subField.name,
                }}
                name={fieldName}
                defaultValue={getFieldGroupDefaultValue(subField)}
                required={false}
              />
            );
          }

          if (subField?.type === FIELD_TYPE.TEXT_LONG) {
            return (
              <RowTableTextLong
                key={subField._id}
                field={{
                  ...subField,
                  name: subField.name,
                }}
                name={fieldName}
                defaultValue={getFieldGroupDefaultValue(subField)}
                required={false}
              />
            );
          }

          if (subField?.type === FIELD_TYPE.DROPDOWN) {
            return (
              <RowTableDropdown
                key={subField._id}
                field={{
                  ...subField,
                  name: subField.name,
                }}
                name={fieldName}
                isMultiple={subField?.configuration?.multiple}
                defaultValue={getFieldGroupDefaultValue(subField)}
                required={false}
              />
            );
          }

          if (subField?.type === FIELD_TYPE.DATE) {
            return (
              <div key={subField._id} className="space-y-2">
                <RowTableDate
                  field={{
                    ...subField,
                    name: `${subField.name} Inicial`,
                  }}
                  name={`${fieldName}-initial`}
                  defaultValue={getFieldGroupDateDefaultValue(
                    subField,
                    "initial"
                  )}
                  required={false}
                />
                <RowTableDate
                  field={{
                    ...subField,
                    name: `${subField.name} Final`,
                  }}
                  name={`${fieldName}-final`}
                  defaultValue={getFieldGroupDateDefaultValue(
                    subField,
                    "final"
                  )}
                  required={false}
                />
              </div>
            );
          }

          return null;
        })}
    </div>
  );
}

function TableFiltersForm({ onClose }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const search = useSearch({
    strict: false,
  });

  const params = useParams({
    strict: false,
  });

  const slug = (params as { slug: string }).slug;

  const table = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const form = useForm();

  const filteredFields =
    table?.data?.fields?.filter(
      (field) => field?.configuration?.filtering && !field?.trashed
    ) ?? [];

  const onSubmit = form.handleSubmit((data) => {
    // Adiciona apenas filtros preenchidos
    const filtersToAdd: Record<string, string> = {};

    for (const field of filteredFields) {
      if (field.type === FIELD_TYPE.DATE) {
        const initialValue = data[`${field.slug}-initial`];
        const finalValue = data[`${field.slug}-final`];

        if (initialValue && initialValue instanceof Date) {
          filtersToAdd[`${field.slug}-initial`] = initialValue
            .toISOString()
            .split("T")[0];
        }

        if (finalValue && finalValue instanceof Date) {
          filtersToAdd[`${field.slug}-final`] = finalValue
            .toISOString()
            .split("T")[0];
        }

        continue; // Skip the default processing
      }

      const value = data[field.slug];

      if (
        !value ||
        value === "" ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0)
      )
        continue;

      if ([FIELD_TYPE.TEXT_SHORT, FIELD_TYPE.TEXT_LONG].includes(field.type)) {
        filtersToAdd[field.slug] = value;
      }

      if (
        [
          FIELD_TYPE.DROPDOWN,
          FIELD_TYPE.RELATIONSHIP,
          FIELD_TYPE.CATEGORY,
        ].includes(field.type)
      ) {
        filtersToAdd[field.slug] = Array.from(value).join(",");
      }
    }

    // Processa campos de FIELD_GROUP - verifica todos os campos que começam com o slug do group
    for (const field of filteredFields) {
      if (field.type === FIELD_TYPE.FIELD_GROUP) {
        // Procura todos os campos no form data que começam com o slug do field group
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith(`${field.slug}-`)) {
            if (
              !value ||
              value === "" ||
              value === null ||
              value === undefined ||
              (Array.isArray(value) && value.length === 0)
            )
              continue;

            // Para campos de data
            if (value instanceof Date) {
              filtersToAdd[key] = value.toISOString().split("T")[0];
            }
            // Para arrays (dropdowns, relationships, categories)
            else if (Array.isArray(value) && value.length > 0) {
              filtersToAdd[key] = value
                .map((item) =>
                  typeof item === "object" && item.value ? item.value : item
                )
                .join(",");
            }
            // Para strings e outros valores
            else {
              filtersToAdd[key] = String(value);
            }
          }
        }
      }
    }

    navigate({
      // @ts-ignore
      search: (state) => ({
        ...state,
        ...filtersToAdd,
        page: 1,
      }),
    });

    onClose();
  });

  const getTextDefaultValue = (field: Field): string | undefined => {
    const paramValue = search[field.slug as keyof typeof search] as string;
    return paramValue ?? undefined;
  };

  const getDateInitialDefaultValue = (field: Field): Date | undefined => {
    const paramValue = search[
      `${field.slug}-initial` as keyof typeof search
    ] as string;
    return paramValue ? parseISO(paramValue) : undefined;
  };

  const getDateFinalDefaultValue = (field: Field): Date | undefined => {
    const paramValue = search[
      `${field.slug}-final` as keyof typeof search
    ] as string;
    return paramValue ? parseISO(paramValue) : undefined;
  };

  const getSelectDefaultValue = (field: Field) => {
    const paramValue = search[field.slug as keyof typeof search] as string;
    if (!paramValue) return undefined;
    return paramValue
      .split(",")
      .map((item: string) => ({ value: item, label: item }));
  };

  const getRelationshipDefaultValue = (field: Field) => {
    const paramValue = search[field.slug as keyof typeof search] as string;
    if (!paramValue) return undefined;
    return paramValue
      .split(",")
      .map((item: string) => ({ value: item, label: `Loading... (${item})` }));
  };

  const getCategoryDefaultValue = (field: Field): string[] | undefined => {
    const paramValue = search[field.slug as keyof typeof search] as string;
    if (!paramValue) return undefined;
    return paramValue.split(",");
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
        <section className="flex flex-col gap-4">
          {filteredFields.map((field) => {
            if (field?.type === FIELD_TYPE.TEXT_SHORT)
              return (
                <RowTableTextShort
                  key={field._id}
                  field={field}
                  defaultValue={getTextDefaultValue(field)}
                  required={false}
                />
              );

            if (field?.type === FIELD_TYPE.TEXT_LONG)
              return (
                <RowTableTextLong
                  key={field._id}
                  field={field}
                  defaultValue={getTextDefaultValue(field)}
                  required={false}
                />
              );

            if (field?.type === FIELD_TYPE.DROPDOWN) {
              return (
                <RowTableDropdown
                  field={field}
                  key={field._id}
                  isMultiple={field?.configuration?.multiple}
                  defaultValue={getSelectDefaultValue(field)}
                  required={false}
                />
              );
            }

            if (field?.type === FIELD_TYPE.DATE) {
              return (
                <div key={field._id} className="inline-flex w-full space-x-2">
                  <RowTableDate
                    field={{ ...field, name: `${field.name} Inicial` }}
                    name={`${field.slug}-initial`}
                    defaultValue={getDateInitialDefaultValue(field)}
                    required={false}
                  />
                  <RowTableDate
                    field={{ ...field, name: `${field.name} Final` }}
                    name={`${field.slug}-final`}
                    defaultValue={getDateFinalDefaultValue(field)}
                    required={false}
                  />
                </div>
              );
            }

            if (field?.type === FIELD_TYPE.CATEGORY) {
              return (
                <RowTableCategory
                  key={field._id}
                  field={field}
                  isMultiple={field?.configuration?.multiple}
                  defaultValue={getCategoryDefaultValue(field)}
                  required={false}
                />
              );
            }

            if (field?.type === FIELD_TYPE.RELATIONSHIP) {
              return (
                <RowTableRelationship
                  field={field}
                  key={field._id}
                  relation={{
                    slug: field?.configuration?.relationship?.table?.slug || "",
                    field:
                      field?.configuration?.relationship?.field?.slug || "",
                  }}
                  isMultiple={field?.configuration?.multiple}
                  defaultValue={getRelationshipDefaultValue(field)}
                  required={false}
                />
              );
            }

            if (field?.type === FIELD_TYPE.FIELD_GROUP) {
              return <FieldGroupFilters key={field._id} field={field} />;
            }

            return <React.Fragment key={field._id}></React.Fragment>;
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
                  style: state.style,
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
    </Form>
  );
}

export function TableFiltersSheet() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const params = useParams({
    strict: false,
  });

  const search = useSearch({
    strict: false,
  });

  const slug = (params as { slug: string }).slug;

  const table = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (!table.data?.fields) return 0;

    const processed = new Set<string>();

    for (let [key] of Object.entries(search)) {
      key = key.replace(/-(?:initial|final)$/, "");

      const field = table.data.fields?.find((field) => field.slug === key);

      if (!field || field.slug !== key || processed.has(field.slug)) continue;

      processed.add(field.slug);
      count++;
    }

    return count;
  };

  const getActiveFilters = () => {
    if (!table.data?.fields) return [];

    const activeFilters: Array<{
      key: string;
      fieldName: string;
      value: string;
      type: string;
      removeKeys: string[];
    }> = [];

    const processed = new Set<string>();

    for (const [searchKey, searchValue] of Object.entries(search)) {
      if (!searchValue || searchValue === "") continue;

      // Para campos de data com sufixos
      const fieldSlug = searchKey.replace(/-(?:initial|final)$/, "");
      const field = table.data.fields?.find((f) => f.slug === fieldSlug);

      if (!field) continue;

      // Evita processar o mesmo campo múltiplas vezes
      if (processed.has(field.slug)) continue;

      if (field.type === FIELD_TYPE.DATE) {
        const initialValue = search[`${field.slug}-initial` as keyof typeof search] as string;
        const finalValue = search[`${field.slug}-final` as keyof typeof search] as string;

        if (initialValue || finalValue) {
          const dateRange = [];
          if (initialValue) dateRange.push(`De: ${initialValue}`);
          if (finalValue) dateRange.push(`Até: ${finalValue}`);

          activeFilters.push({
            key: field.slug,
            fieldName: field.name,
            value: dateRange.join(", "),
            type: "date",
            removeKeys: [`${field.slug}-initial`, `${field.slug}-final`]
          });
          processed.add(field.slug);
        }
      } else if (field.type === FIELD_TYPE.FIELD_GROUP) {
        // Para field groups, processa os sub-campos
        const groupFilters = [];
        const groupRemoveKeys = [];

        for (const [key, value] of Object.entries(search)) {
          if (key.startsWith(`${field.slug}-`) && value && value !== "") {
            const subFieldSlug = key.replace(`${field.slug}-`, "").replace(/-(?:initial|final)$/, "");
            groupFilters.push(`${subFieldSlug}: ${value}`);
            groupRemoveKeys.push(key);
          }
        }

        if (groupFilters.length > 0) {
          activeFilters.push({
            key: field.slug,
            fieldName: field.name,
            value: groupFilters.join(", "),
            type: "group",
            removeKeys: groupRemoveKeys
          });
          processed.add(field.slug);
        }
      } else if (searchKey === field.slug) {
        // Campos normais
        let displayValue = searchValue;

        if (Array.isArray(searchValue)) {
          displayValue = searchValue.join(", ");
        } else if (typeof searchValue === "string" && searchValue.includes(",")) {
          displayValue = searchValue.split(",").join(", ");
        }

        activeFilters.push({
          key: field.slug,
          fieldName: field.name,
          value: String(displayValue),
          type: "normal",
          removeKeys: [field.slug]
        });
        processed.add(field.slug);
      }
    }

    return activeFilters;
  };

  const removeIndividualFilter = (filterKeys: string[]) => {
    const newSearch = { ...search };

    // Remove as chaves específicas do filtro
    filterKeys.forEach(key => {
      delete newSearch[key as keyof typeof newSearch];
    });

    navigate({
      // @ts-ignore
      search: () => ({
        ...newSearch,
        page: 1,
      }),
    });
  };

  const activeFiltersCount = getActiveFiltersCount();
  const activeFilters = getActiveFilters();

  return (
    <Root open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          <Button className={cn("shadow-none p-1 h-auto")} variant="outline">
            <FilterIcon className="size-4" />
            <span>{t("TABLE_BUTTON_FILTER_LABEL", "Filtro")}</span>
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
          <SheetTitle className="text-lg font-medium">
            {t("TABLE_ROUTE_SHEET_INTERNAL_FILTER_TITLE", "Filtros")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_FILTER_DESCRIPTION",
              "Aplique filtros para a busca de dados"
            )}
          </SheetDescription>
        </SheetHeader>

        {activeFilters.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Filtros Ativos
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <Badge
                  key={`${filter.key}-${index}`}
                  variant="outline"
                  className="flex items-center gap-1 pr-1 max-w-xs"
                >
                  <span className="truncate">
                    <strong>{filter.fieldName}:</strong> {filter.value}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive/20 rounded-full"
                    onClick={() => removeIndividualFilter(filter.removeKeys)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <TableFiltersForm onClose={() => setOpen(false)} />
      </SheetContent>
    </Root>
  );
}
