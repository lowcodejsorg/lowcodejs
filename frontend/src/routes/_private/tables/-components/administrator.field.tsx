import {
  SearchableSelect,
  type SearchableResponse,
} from "@/components/common/searchable-select";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Paginated, User } from "@/lib/entity";
import { cn } from "@/lib/utils";
import {
  useFormContext,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";

type Query = {
  search?: string;
  page: number;
};

const fetchPaginate = async ({
  search,
  ...query
}: Query): Promise<SearchableResponse> => {
  const response = await API.get<Paginated<User[]>>("/users/paginated", {
    params: {
      ...query,
      perPage: 10,
      ...(search && {
        search: search,
      }),
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

type AdministratorFieldType = {
  field: ControllerRenderProps<FieldValues, "configuration.administrators">;
  owner: User | null;
  required?: boolean;
};

export function AdministratorField({
  field,
  owner,
  required = false,
}: AdministratorFieldType): React.ReactElement {
  const { t } = useI18n();
  const form = useFormContext();

  const fetchWrapper = async (query: string, page: number) => {
    try {
      const result = await fetchPaginate({
        search: query,
        page,
      });

      return {
        ...result,
        items: result.items.filter((item) => item.value !== owner?._id),
      };
    } catch (error) {
      console.error("Error fetching options:", error);
      return { items: [], nextPage: null, totalItems: 0 };
    }
  };

  const hasError = Boolean(form.formState.errors[field.name]);

  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        {t("TABLE_SHEET_FIELD_ADMINISTRATOR_LABEL", "Administradores")}
        {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <FormControl>
        <SearchableSelect
          identifier={"administrators".concat("-").concat("paginated")}
          fetchOptions={fetchWrapper}
          selectedValues={field.value || []}
          onChange={field.onChange}
          isMultiple
          placeholder={
            t(
              "TABLE_SELECT_ADMINISTRATORS_PLACEHOLDER",
              "Select administrators"
            ) as string
          }
          maxDisplayItems={2}
          className={cn(hasError && "border-destructive")}
          prioritizeSelected
        />
      </FormControl>
      <FormMessage className="text-right text-destructive" />
    </FormItem>
  );
}
