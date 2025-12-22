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
import { FIELD_FORMAT } from '@/lib/constant';
import { cn } from '@/lib/utils';

interface Props {
  defaultValue?: Array<SelectOption>;
  required?: boolean;
}

const COLUMN_DATE_FORMAT_LIST = [
  {
    label: 'DD/MM/AAAA',
    value: FIELD_FORMAT['DD_MM_YYYY'],
  },
  {
    label: 'MM/DD/AAAA',
    value: FIELD_FORMAT['MM_DD_YYYY'],
  },
  {
    label: 'AAAA/MM/DD',
    value: FIELD_FORMAT['YYYY_MM_DD'],
  },
  {
    label: 'DD/MM/AAAA hh:mm:ss',
    value: FIELD_FORMAT['DD_MM_YYYY_HH_MM_SS'],
  },
  {
    label: 'MM/DD/AAAA hh:mm:ss',
    value: FIELD_FORMAT['MM_DD_YYYY_HH_MM_SS'],
  },
  {
    label: 'AAAA/MM/DD hh:mm:ss',
    value: FIELD_FORMAT['YYYY_MM_DD_HH_MM_SS'],
  },
  {
    label: 'DD-MM-AAAA',
    value: FIELD_FORMAT['DD_MM_YYYY_DASH'],
  },
  {
    label: 'MM-DD-AAAA',
    value: FIELD_FORMAT['MM_DD_YYYY_DASH'],
  },
  {
    label: 'AAAA-MM-DD',
    value: FIELD_FORMAT['YYYY_MM_DD_DASH'],
  },
  {
    label: 'DD-MM-AAAA hh:mm:ss',
    value: FIELD_FORMAT['DD_MM_YYYY_HH_MM_SS_DASH'],
  },
  {
    label: 'MM-DD-AAAA hh:mm:ss',
    value: FIELD_FORMAT['MM_DD_YYYY_HH_MM_SS_DASH'],
  },
  {
    label: 'AAAA-MM-DD hh:mm:ss',
    value: FIELD_FORMAT['YYYY_MM_DD_HH_MM_SS_DASH'],
  },
];

export function TableFieldDateFormat({
  defaultValue = [],
  required,
}: Props): React.JSX.Element {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.format"
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value) return 'Formato da data é obrigatório';

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];

        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              Formato da data
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <SimpleSelect
                placeholder={'Formato da data'}
                selectedValues={field.value ?? []}
                onChange={field.onChange}
                options={COLUMN_DATE_FORMAT_LIST}
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
