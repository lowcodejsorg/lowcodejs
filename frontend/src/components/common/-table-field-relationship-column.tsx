/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useQuery } from '@tanstack/react-query';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';

import type { SelectOption } from './-simple-select';
import { SimpleSelect } from './-simple-select';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { API } from '@/lib/api';
import type { ITable } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

type Option = SelectOption & { slug: string };

interface Props {
  required?: boolean;
  defaultValue?: Array<Option>;
}

function RelationshipField({
  field,
  required,
}: {
  field: ControllerRenderProps<
    FieldValues,
    'configuration.relationship.field._id'
  >;
  required?: boolean;
}): React.JSX.Element {
  const form = useFormContext();

  const slug = form.watch('configuration.relationship.table.slug');

  const table = useQuery({
    queryKey: ['/tables/'.concat(slug), slug],
    queryFn: async () => {
      const route = '/tables/'.concat(slug);
      const response = await API.get<ITable>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const OPTIONS = table?.data?.fields?.map((field) => ({
    label: field.name,
    value: field._id,
    slug: field.slug,
  }));

  const hasError = Boolean(form.getFieldState(field.name).error);

  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        Campo de relacionamento
        {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <FormControl>
        <SimpleSelect
          disabled={table.status === 'pending'}
          placeholder={'Selecione um campo'}
          selectedValues={field.value ?? []}
          onChange={(options) => {
            field.onChange(options);

            const [option] = options as Array<Option>;

            if (!option.value) return;

            form.setValue('configuration.relationship.field.slug', option.slug);
          }}
          options={OPTIONS ?? []}
          className={cn('w-full', hasError && 'border-destructive')}
        />
      </FormControl>

      <FormMessage className="text-right text-destructive" />
    </FormItem>
  );
}

export function TableFieldRelationshipColumn({
  defaultValue,
  required,
}: Props): React.JSX.Element {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      defaultValue={defaultValue ?? []}
      name="configuration.relationship.field._id"
      rules={{
        validate: (value) => {
          if (!value && required) return 'Campo é obrigatório';

          if (value && Array.isArray(value) && value.length === 0 && required)
            return 'Adicione uma opção';

          return true;
        },
      }}
      render={({ field }) => (
        <RelationshipField
          field={field}
          required={required}
        />
      )}
    />
  );
}
