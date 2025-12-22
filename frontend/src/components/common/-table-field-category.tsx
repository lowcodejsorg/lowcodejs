import { useFormContext } from 'react-hook-form';

import type { TreeNode } from './-tree-list';
import { TreeEditor } from './-tree-node';

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
  defaultValue?: Array<TreeNode>;
}

export function TableFieldCategory({
  required,
  defaultValue = [],
}: Props): React.JSX.Element {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.category"
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value && required) return 'Estrutura da categoria é obrigatória';

          if (value && Array.isArray(value) && value.length === 0)
            return 'Adicione uma opção';

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];
        return (
          <FormItem className="space-y-1">
            <FormLabel className="data-[error=true]:text-destructive">
              Estrutura da categoria
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <TreeEditor
                initialData={field.value ?? []}
                onChange={field.onChange}
                className={cn(hasError && 'border-destructive')}
              />
            </FormControl>
            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
