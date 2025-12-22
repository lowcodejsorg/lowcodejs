import React from 'react';
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

export function TableFieldName({
  className,
  required,
  defaultValue,
  ...props
}: React.ComponentProps<typeof Input>): React.JSX.Element {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="name"
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value) return 'Nome é obrigatório';

          if (value.length > 40)
            return 'O nome deve ter no máximo 40 caracteres';

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];
        return (
          <FormItem className="space-y-1">
            <FormLabel className="data-[error=true]:text-destructive ">
              Nome
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={'Nome do campo'}
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
