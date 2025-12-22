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
import { cn } from '@/lib/utils';

interface Props {
  required?: boolean;
  defaultValue?: Array<SelectOption>;
}

export function TableFieldRelationshipOrder({
  defaultValue,
  required,
}: Props): React.JSX.Element {
  const form = useFormContext();

  const ORDER_LIST = [
    {
      label: 'Ascendente',
      value: 'asc',
    },
    {
      label: 'Descendente',
      value: 'desc',
    },
  ];

  return (
    <FormField
      control={form.control}
      name="configuration.relationship.order"
      defaultValue={defaultValue ?? []}
      rules={{
        validate: (value) => {
          if (!value && required) return 'Ordem é obrigatória';

          if (value && Array.isArray(value) && value.length === 0 && required)
            return 'Adicione ao menos uma opção';

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = Boolean(form.formState.errors[field.name]);

        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              Ordem
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <SimpleSelect
                placeholder={'Selecione uma ordem'}
                selectedValues={field.value ?? []}
                onChange={field.onChange}
                options={ORDER_LIST}
                className={cn('w-full', hasError && 'border-destructive')}
              />
            </FormControl>

            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
