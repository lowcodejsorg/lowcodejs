import { useFormContext } from 'react-hook-form';

import type { Option } from './-multi-selector';
import { MultipleSelector } from './-multi-selector';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

export function TableFieldDropdown({
  defaultValue,
  required,
}: {
  defaultValue?: Array<Option>;
  required?: boolean;
}): React.JSX.Element {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.dropdown"
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value && required) return 'Adicione ao menos uma opção';

          if (value && Array.isArray(value) && value.length === 0 && required)
            return 'Adicione ao menos uma opção';

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.getFieldState(field.name).error;
        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              Opções
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <MultipleSelector
                onChange={field.onChange}
                defaultOptions={defaultValue}
                value={field.value ?? []}
                creatable
                triggerSearchOnFocus
                allowReorder={true}
                placeholder={'Escreva e adicione'}
                emptyIndicator={null}
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
