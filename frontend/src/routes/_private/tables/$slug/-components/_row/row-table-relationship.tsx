import {
  SearchableSelect,
  type SearchableOption,
  type SearchableResponse,
} from "@/components/common/searchable-select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Field, Paginated, Row } from "@/lib/entity";
import { cn } from "@/lib/utils";
import React from "react";
import {
  useFormContext,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";

type Query = {
  field: string;
  search?: string;
  page: number;
  slug: string;
};

const fetchPaginate = async ({
  search,
  slug,
  field,
  ...query
}: Query): Promise<SearchableResponse> => {
  const route = "/tables/".concat(slug).concat("/rows/paginated");
  const response = await API.get<Paginated<Row[]>>(route, {
    params: {
      ...query,
      perPage: 10,
      ...(search && {
        [field]: search,
      }),
    },
  });

  return {
    items: response?.data?.data?.map((item) => ({
      value: item._id!.toString(),
      label: item[field]!.toString(),
    })),
    nextPage:
      query.page < response?.data?.meta.lastPage ? query.page + 1 : null,
    totalItems: response?.data?.meta.total,
  };
};

type RelationshipFieldType = {
  f: ControllerRenderProps<FieldValues>;
  defaultValue?: SearchableOption[];
  relation: {
    field: string;
    slug: string;
  };
  field: Field;
  required?: boolean;
  isMultiple?: boolean;
};

function RelationshipField({
  f,
  defaultValue = [],
  relation,
  field,
  required = false,
  isMultiple = false,
}: RelationshipFieldType) {
  const { t } = useI18n();

  const [selected, setSelected] = React.useState<SearchableOption[]>([
    ...(defaultValue || []),
  ]);

  // Effect to load labels for default values if they don't have labels
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
              search: "",
              slug: relation.slug,
              page: 1,
              field: relation.field,
            });

            // Match the IDs with the fetched items
            const updatedSelected = defaultValue.map((selectedItem) => {
              const foundItem = result.items.find(
                (item) => item.value === selectedItem.value
              );
              return foundItem || selectedItem;
            });

            setSelected(updatedSelected);
          } catch (error) {
            console.error("Error loading labels for relationship:", error);
          }
        }
      }
    };

    loadLabels();
  }, [defaultValue, relation.slug, relation.field]);

  const fetchWrapper = async (query: string, page: number) => {
    try {
      const result = await fetchPaginate({
        search: query,
        slug: relation.slug,
        page,
        field: relation.field,
      });

      return result;
    } catch (error) {
      console.error("Error fetching options:", error);
      return { items: [], nextPage: null, totalItems: 0 };
    }
  };

  const form = useFormContext();

  const hasError = !!form.formState.errors[f.name];
  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        {field.name} {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <FormControl>
        <SearchableSelect
          identifier={relation.slug
            .concat("-")
            .concat(relation.field)
            .concat("-")
            .concat("paginate")}
          fetchOptions={fetchWrapper}
          selectedValues={selected}
          onChange={(options) => {
            setSelected(options);
            const normalized = options.map((v) => v.value);
            f.onChange(normalized);
          }}
          isMultiple={isMultiple}
          placeholder={String(
            t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_SELECT_OPTION_PLACEHOLDER",
              t("TABLE_SELECT_OPTION_PLACEHOLDER", "Select")
            )
          )
            .concat(" ")
            .concat(field.name)}
          maxDisplayItems={2}
          className={cn(hasError && "border-destructive")}
          prioritizeSelected
        />
      </FormControl>
      <FormMessage className="text-right text-destructive" />
    </FormItem>
  );
}

interface Props {
  field: Field;
  isMultiple?: boolean;
  required?: boolean;
  defaultValue?: SearchableOption[];
  relation: {
    field: string;
    slug: string;
  };
  name?: string;
}

export function RowTableRelationship({
  field: fieldProp,
  isMultiple = false,
  required,
  defaultValue,
  relation,
  name,
}: Props): React.ReactElement {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={name ?? fieldProp.slug}
      defaultValue={
        isMultiple
          ? (defaultValue?.flatMap((v) => v.value) ?? [])
          : defaultValue?.[0]?.value
      }
      rules={{
        validate: (value) => {
          if (!value && required)
            return fieldProp.name
              .concat(" ")
              .concat(
                t(
                  "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_FIELD_REQUIRED_ERROR",
                  "é obrigatório"
                ) as string
              );

          if (value && Array.isArray(value) && value.length === 0 && required)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_AT_LEAST_ONE_OPTION_ERROR",
              "Adicione ao menos uma opção"
            );

          return true;
        },
      }}
      render={({ field: f }) => (
        <RelationshipField
          f={f}
          defaultValue={defaultValue}
          relation={relation}
          field={fieldProp}
        />
      )}
    />
  );
}
