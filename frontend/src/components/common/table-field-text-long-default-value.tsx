import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function TableFieldTextLongDefaultValue({
  className,
  required,
  defaultValue,
  ...props
}: React.ComponentProps<typeof Textarea>): React.JSX.Element {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.defaultValue"
      defaultValue={defaultValue ?? ''}
      render={({ field }) => {
        const hasError = !!form.getFieldState(field.name).error;

        return (
          <FormItem className="space-y-1">
            <FormLabel className="data-[error=true]:text-destructive">
              Valor Padrão
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={
                  'Valor padrão (Se deixar em branco, o campo ficara vazio)'
                }
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
