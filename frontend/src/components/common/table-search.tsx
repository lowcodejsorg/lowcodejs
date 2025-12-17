import { API } from "@/lib/api";
import type { Paginated, Table } from "@/lib/entity";
import { cn } from "@/lib/utils";
import React from "react";
import {
  useFormContext,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";
import { FormControl, FormItem, FormLabel, FormMessage } from "../ui/form";
import {
  SearchableSelect,
  type SearchableOption,
  type SearchableResponse,
} from "./searchable-select";

type Query = {
  search?: string;
  page: number;
};

const fetchPaginate = async ({
  search,
  ...query
}: Query): Promise<SearchableResponse> => {
  const route = "/tables/paginated";
  const response = await API.get<Paginated<Table[]>>(route, {
    params: {
      ...query,
      ...(search && { search }),
      perPage: 10,
      trashed: false,
    },
  });

  return {
    items: response?.data?.data?.map((item) => ({
      value: item._id!.toString(),
      label: item.name!.toString(),
    })),
    nextPage:
      query.page < response?.data?.meta.lastPage ? query.page + 1 : null,
    totalItems: response?.data?.meta.total,
  };
};

type TableSearchFieldProps = {
  field: ControllerRenderProps<FieldValues>;
  defaultValue?: SearchableOption[];
  required?: boolean;
  isMultiple?: boolean;
};

export function TableSearchField({
  field,
  defaultValue = [],
  required = false,
  isMultiple = false,
}: TableSearchFieldProps) {
  const [selected, setSelected] = React.useState<SearchableOption[]>([
    ...(defaultValue || []),
  ]);

  // Initialize form field with default value
  React.useEffect(() => {
    if (defaultValue && defaultValue.length > 0) {
      field.onChange(defaultValue);
    }
  }, []);

  React.useEffect(() => {
    const loadLabels = async () => {
      if (defaultValue && defaultValue.length > 0) {
        const itemsWithoutLabels = defaultValue.filter(
          (item) => !item.label || item.label.startsWith("Loading...")
        );

        if (itemsWithoutLabels.length > 0) {
          try {
            // Fetch first page to get labels for the selected IDs
            const result = await fetchPaginate({
              page: 1,
            });

            // Match the IDs with the fetched items
            const updatedSelected = defaultValue.map((selectedItem) => {
              const foundItem = result.items.find(
                (item) => item.value === selectedItem.value
              );
              return foundItem || selectedItem;
            });

            setSelected(updatedSelected);
            // Sync updated values with form field
            field.onChange(updatedSelected);
          } catch (error) {
            console.error("Error loading labels for relationship:", error);
          }
        }
      }
    };

    loadLabels();
  }, [defaultValue, field]);

  const fetchWrapper = async (query: string, page: number) => {
    try {
      const result = await fetchPaginate({
        search: query,
        page,
      });

      return result;
    } catch (error) {
      console.error("Error fetching options:", error);
      return { items: [], nextPage: null, totalItems: 0 };
    }
  };

  const form = useFormContext();

  const hasError = !!form.formState.errors[field.name];

  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        Tabela {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <FormControl>
        <SearchableSelect
          identifier={"table-search-field"}
          fetchOptions={fetchWrapper}
          selectedValues={selected}
          onChange={(values) => {
            setSelected(values);
            field.onChange(values);
          }}
          isMultiple={isMultiple}
          placeholder={"Selecione uma tabela"}
          maxDisplayItems={2}
          className={cn(hasError && "border-destructive")}
          prioritizeSelected
        />
      </FormControl>
      <FormMessage className="text-right text-destructive" />
    </FormItem>
  );
}
