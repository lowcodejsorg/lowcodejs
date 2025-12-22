/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';

import type {
  SearchableOption,
  SearchableResponse,
} from './-searchable-select';
import { SearchableSelect } from './-searchable-select';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { API } from '@/lib/api';
import type { ITable, Paginated } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

type Option = SearchableOption & { slug: string };
interface Props {
  required?: boolean;
  defaultValue?: Array<Option>;
  tableSlug: string;
}

type Query = {
  search?: string;
  page: number;
  tableSlug: string;
};

const fetchPaginate = async ({
  search,
  tableSlug,
  ...query
}: Query): Promise<
  Omit<SearchableResponse, 'items'> & { items: Array<Option> }
> => {
  const response = await API.get<Paginated<ITable>>('/tables/paginated', {
    params: {
      ...query,
      perPage: 10,
      ...(search && {
        search,
      }),
    },
  });

  return {
    items: response?.data?.data
      ?.filter((item) => item.slug !== tableSlug)
      ?.map((item) => ({
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
  tableSlug,
}: {
  field: ControllerRenderProps<
    FieldValues,
    'configuration.relationship.table._id'
  >;
  required?: boolean;
  tableSlug: string;
}): React.JSX.Element {
  const form = useFormContext();
  const hasError = !!form.getFieldState(field.name).error;

  const fetchWrapper = async (query: string, page: number) => {
    try {
      const result = await fetchPaginate({
        search: query,
        page,
        tableSlug,
      });

      return result;
    } catch (error) {
      console.error('Error fetching options:', error);
      return { items: [], nextPage: null, totalItems: 0 };
    }
  };

  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        Tabela de relacionamento
        {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <FormControl>
        <SearchableSelect
          identifier={'configuration.relationship.table.paginate'}
          fetchOptions={fetchWrapper}
          selectedValues={field.value ?? []}
          onChange={(options) => {
            field.onChange(options);

            const [option] = options as Array<Option>;
            if (!option.value) return;
            form.setValue('configuration.relationship.table.slug', option.slug);

            // form.resetField("configuration.relationship.field._id");
            // form.resetField("configuration.relationship.field.slug");
            // form.resetField("configuration.relationship.order");
          }}
          isMultiple={false}
          placeholder={'Selecione uma tabela de relacionamento'}
          maxDisplayItems={1}
          className={cn(hasError && 'border-destructive')}
          prioritizeSelected
        />
      </FormControl>

      <FormMessage className="text-right text-destructive" />
    </FormItem>
  );
}

export function TableFieldRelationship({
  required,
  defaultValue,
  tableSlug,
}: Props) {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.relationship.table._id"
      defaultValue={defaultValue ?? []}
      rules={{
        validate: (value) => {
          if (!value && required)
            return 'Tabela de relacionamento é obrigatório';

          if (value && Array.isArray(value) && value.length === 0 && required)
            return 'Adicione ao menos uma opção';

          return true;
        },
      }}
      render={({ field }) => (
        <RelationshipField
          field={field}
          required={required}
          tableSlug={tableSlug}
        />
      )}
    />
  );
}
