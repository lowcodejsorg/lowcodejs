import { useFormContext } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FIELD_FORMAT } from '@/lib/constant';
import { cn } from '@/lib/utils';

interface TableFieldTextShortFormatProps {
  required?: boolean;
  defaultValue?: string;
}
export function TableFieldTextShortFormat({
  defaultValue,
  required,
}: TableFieldTextShortFormatProps): React.JSX.Element {
  const form = useFormContext();

  const COLUMN_TEXT_SHORT_FORMAT_LIST = [
    {
      label: 'Alfanumérico',
      value: FIELD_FORMAT.ALPHA_NUMERIC,
    },
    {
      label: 'Inteiro',
      value: FIELD_FORMAT.INTEGER,
    },
    {
      label: 'Decimal',
      value: FIELD_FORMAT.DECIMAL,
    },
    {
      label: 'URL',
      value: FIELD_FORMAT.URL,
    },
    {
      label: 'E-mail',
      value: FIELD_FORMAT.EMAIL,
    },
  ];

  return (
    <FormField
      control={form.control}
      name="configuration.format"
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value && required) return 'Formato é obrigatório';

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];

        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              Formato
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger
                  className={cn('w-full', hasError && 'border-destructive')}
                >
                  <SelectValue placeholder="Selecione um formato para o campo" />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_TEXT_SHORT_FORMAT_LIST.map((item) => (
                    <SelectItem
                      value={item.value}
                      key={item.value}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>

            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
