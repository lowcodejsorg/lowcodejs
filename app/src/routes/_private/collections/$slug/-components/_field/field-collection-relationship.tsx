import {
  SearchableSelect,
  type SearchableResponse,
} from "@/components/custom/searchable-select";
import type { SelectOption } from "@/components/custom/simple-select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Collection, Paginated } from "@/lib/entity";
import { cn } from "@/lib/utils";
import {
  useFormContext,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";

type Option = SelectOption & { slug: string };
interface Props {
  required?: boolean;
  defaultValue?: Option[];
}

type Query = {
  search?: string;
  page: number;
};

const fetchPaginate = async ({
  search,
  ...query
}: Query): Promise<Omit<SearchableResponse, "items"> & { items: Option[] }> => {
  const response = await API.get<Paginated<Collection[]>>(
    "/collections/paginated",
    {
      params: {
        ...query,
        perPage: 10,
        ...(search && {
          search,
        }),
      },
    }
  );

  return {
    items: response?.data?.data?.map((item) => ({
      value: item._id,
      label: item.name?.toString(),
      slug: item.slug,
    })),
    nextPage:
      query.page < response?.data?.meta.lastPage ? query.page + 1 : null,
    totalItems: response?.data?.meta.total,
  };
};

function RelationshipField({
  field,
  required,
}: {
  field: ControllerRenderProps<
    FieldValues,
    "configuration.relationship.collection._id"
  >;
  required?: boolean;
}) {
  const { t } = useI18n();
  const form = useFormContext();
  const hasError = !!form.getFieldState(field.name).error;

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

  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        {t(
          "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_RELATIONSHIP_LIST_LABEL",
          "Lista"
        )}{" "}
        {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <FormControl>
        <SearchableSelect
          identifier={"configuration.relationship.collection.paginate"}
          fetchOptions={fetchWrapper}
          selectedValues={field.value ?? []}
          onChange={(options) => {
            field.onChange(options);

            const [option] = options as Option[];
            if (!option.value) return;
            form.setValue(
              "configuration.relationship.collection.slug",
              option.slug
            );

            // form.resetField("configuration.relationship.field._id");
            // form.resetField("configuration.relationship.field.slug");
            // form.resetField("configuration.relationship.order");
          }}
          isMultiple={false}
          placeholder={
            t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_RELATIONSHIP_LIST_PLACEHOLDER",
              t("COLLECTION_SELECT_LIST_RELATIONSHIP_PLACEHOLDER", "Select list for relationship")
            ) as string
          }
          maxDisplayItems={1}
          className={cn(hasError && "border-destructive")}
          prioritizeSelected
        />
      </FormControl>

      <FormMessage className="text-right text-destructive" />
    </FormItem>
  );
}

export function FieldCollectionRelationship({ required, defaultValue }: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.relationship.collection._id"
      defaultValue={defaultValue ?? []}
      rules={{
        validate: (value) => {
          if (!value && required)
            return t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_RELATIONSHIP_LIST_REQUIRED_ERROR",
              "Lista é obrigatória"
            );

          if (value && Array.isArray(value) && value.length === 0 && required)
            return t(
              "COLLECTION_ROUTE_SHEET_INTERNAL_FIELD_OPTIONS_REQUIRED_ERROR",
              "Adicione ao menos uma opção"
            );

          return true;
        },
      }}
      render={({ field }) => (
        <RelationshipField field={field} required={required} />
      )}
    />
  );
}
