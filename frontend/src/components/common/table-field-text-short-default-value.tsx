import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function TableFieldTextShortDefaultValue({
  className,
  required,
  defaultValue,
  ...props
}: React.ComponentProps<typeof Input>): React.JSX.Element {
  const form = useFormContext();
  return (
    <FormField
      control={form.control}
      name="configuration.defaultValue"
      defaultValue={defaultValue ?? ''}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];

        return (
          <FormItem className="space-y-1">
            <FormLabel className="data-[error=true]:text-destructive">
              Valor padrão
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={'Valor padrão'}
                className={cn(hasError && 'border-destructive', className)}
                {...field}
                {...props}
              />
            </FormControl>
            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
